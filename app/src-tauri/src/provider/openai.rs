//! The OpenAI-compatible client.
//!
//! One shape, which is what Ollama, LM Studio, vLLM, llama.cpp and DeepSeek all
//! speak. The address is a parameter, so a local server on another port is a
//! setting and not a second client.

use std::time::Duration;

use reqwest::blocking::{Client, Response};
use reqwest::StatusCode;
use serde_json::json;

use super::keychain::redact;
use super::prompt;
use super::validate;
use super::{Answer, ModelClient, ProviderError, Shortlist};

/// How long the model has to start answering. A first token from a local model
/// on a cold page cache can take a while; a hung server must not hold the window.
const TIMEOUT: Duration = Duration::from_secs(60);

/// The one retry, and how long it waits when the provider does not say.
const RETRY_WAIT: Duration = Duration::from_secs(2);

/// The answer's ceiling. Half of the prompt's budget, and enough for twenty
/// candidates at one sentence each.
const MAX_TOKENS: u32 = 1_000;

/// The addresses the interface offers. Local ones are editable; DeepSeek's is
/// fixed and shown read-only, so a key is never posted to a stray host by a typo.
pub const OLLAMA_BASE: &str = "http://127.0.0.1:11434/v1";
pub const LM_STUDIO_BASE: &str = "http://127.0.0.1:1234/v1";
pub const DEEPSEEK_BASE: &str = "https://api.deepseek.com/v1";

/// Pinned generation parameters. Determinism is an aspiration with a cloud model
/// and a fact with a local one, but the request always asks for the same thing.
const TEMPERATURE: f64 = 0.0;
const TOP_P: f64 = 1.0;

pub struct OpenAiClient {
    agent: Client,
    base: String,
    model: String,
    key: Option<String>,
    retry_wait: Duration,
}

impl std::fmt::Debug for OpenAiClient {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("OpenAiClient")
            .field("base", &self.base)
            .field("model", &self.model)
            .field("key", &self.key.as_ref().map(|_| "[redacted]"))
            .finish()
    }
}

impl OpenAiClient {
    pub fn local(base: impl Into<String>, model: impl Into<String>) -> Self {
        Self::build(base.into(), model.into(), None, RETRY_WAIT)
    }

    pub fn cloud(base: impl Into<String>, model: impl Into<String>, key: impl Into<String>) -> Self {
        Self::build(base.into(), model.into(), Some(key.into()), RETRY_WAIT)
    }

    /// For the tests: a retry that does not make the suite wait two seconds.
    pub fn with_retry_wait(mut self, wait: Duration) -> Self {
        self.retry_wait = wait;
        self
    }

    fn build(base: String, model: String, key: Option<String>, retry_wait: Duration) -> Self {
        let agent = Client::builder()
            .timeout(TIMEOUT)
            .build()
            .expect("the HTTP client should build");
        Self {
            agent,
            base: base.trim_end_matches('/').to_string(),
            model,
            key,
            retry_wait,
        }
    }

    fn send(&self, request: reqwest::blocking::RequestBuilder) -> Result<Response, ProviderError> {
        let request = if let Some(key) = &self.key {
            request.bearer_auth(key)
        } else {
            request
        };

        request.send().map_err(|_| ProviderError::Unreachable {
            address: self.base.clone(),
        })
    }

    /// A status the model layer has a name for, or a plain HTTP failure, with
    /// this client's key scrubbed out of whatever the provider said.
    fn status_error(&self, status: StatusCode, response: Response) -> ProviderError {
        let message = response.text().unwrap_or_default();
        let message: String = message.trim().chars().take(300).collect();
        let message = redact(&message, self.key.as_deref());

        if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN {
            return ProviderError::Auth { message };
        }

        if status == StatusCode::TOO_MANY_REQUESTS {
            return ProviderError::Busy { retry_after_ms: 0 };
        }

        ProviderError::Http {
            status: status.as_u16(),
            message,
        }
    }

    /// POST with the one retry the plan allows: 429 and 5xx, never 4xx.
    fn post(&self, body: &serde_json::Value) -> Result<Response, ProviderError> {
        let url = format!("{}/chat/completions", self.base);
        let first = self.send(self.agent.post(&url).json(body))?;

        if !is_retryable(first.status()) {
            return Ok(first);
        }

        let wait = retry_after(first.headers()).unwrap_or(self.retry_wait);
        std::thread::sleep(wait);

        self.send(self.agent.post(&url).json(body))
    }
}

fn is_retryable(status: StatusCode) -> bool {
    status == StatusCode::TOO_MANY_REQUESTS || status.is_server_error()
}

fn retry_after(headers: &reqwest::header::HeaderMap) -> Option<Duration> {
    headers
        .get(reqwest::header::RETRY_AFTER)?
        .to_str()
        .ok()?
        .trim()
        .parse::<u64>()
        .ok()
        .map(Duration::from_secs)
}

impl ModelClient for OpenAiClient {
    fn models(&self) -> Result<Vec<String>, ProviderError> {
        let url = format!("{}/models", self.base);
        let response = self.send(self.agent.get(&url))?;
        let status = response.status();

        if !status.is_success() {
            return Err(self.status_error(status, response));
        }

        let body: serde_json::Value = response.json().map_err(|err| ProviderError::MalformedAnswer {
            detail: err.to_string(),
        })?;

        Ok(body["data"]
            .as_array()
            .map(|models| {
                models
                    .iter()
                    .filter_map(|model| model["id"].as_str().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default())
    }

    fn rank(&self, shortlist: &Shortlist) -> Result<Answer, ProviderError> {
        let body = json!({
            "model": self.model,
            "temperature": TEMPERATURE,
            "top_p": TOP_P,
            "max_tokens": MAX_TOKENS,
            "messages": [
                {
                    "role": "system",
                    "content": "You rank subtitle passages and answer with JSON only."
                },
                { "role": "user", "content": prompt::build(shortlist) }
            ]
        });

        let response = self.post(&body)?;
        let status = response.status();

        if !status.is_success() {
            return Err(self.status_error(status, response));
        }

        let body: serde_json::Value = response.json().map_err(|err| ProviderError::MalformedAnswer {
            detail: err.to_string(),
        })?;

        let content = body["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| ProviderError::MalformedAnswer {
                detail: "the answer carried no message".into(),
            })?;

        validate::read(shortlist, content)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::Shortlisted;
    use std::sync::{Arc, Mutex};
    use std::thread::JoinHandle;

    #[derive(Debug, Clone)]
    struct Seen {
        url: String,
        body: String,
        authorization: Option<String>,
    }

    struct Reply {
        status: u16,
        body: String,
        retry_after: Option<String>,
    }

    fn reply(status: u16, body: &str) -> Reply {
        Reply {
            status,
            body: body.to_string(),
            retry_after: None,
        }
    }

    struct Stub {
        base: String,
        seen: Arc<Mutex<Vec<Seen>>>,
        handle: JoinHandle<()>,
    }

    impl Stub {
        /// A server on a random port that answers the given replies in order and
        /// remembers every request it was given.
        fn start(replies: Vec<Reply>) -> Self {
            let server = tiny_http::Server::http("127.0.0.1:0").expect("the stub should bind");
            let port = match server.server_addr() {
                tiny_http::ListenAddr::IP(addr) => addr.port(),
                other => panic!("unexpected address {other:?}"),
            };
            let seen = Arc::new(Mutex::new(Vec::new()));
            let recorder = seen.clone();

            let handle = std::thread::spawn(move || {
                for reply in replies {
                    let Ok(Some(mut request)) = server.recv_timeout(Duration::from_secs(10)) else {
                        return;
                    };

                    let authorization = request
                        .headers()
                        .iter()
                        .find(|header| header.field.equiv("Authorization"))
                        .map(|header| header.value.as_str().to_string());

                    let mut body = String::new();
                    let _ = request.as_reader().read_to_string(&mut body);
                    recorder.lock().expect("recorder").push(Seen {
                        url: request.url().to_string(),
                        body,
                        authorization,
                    });

                    let mut response =
                        tiny_http::Response::from_string(reply.body).with_status_code(reply.status);
                    if let Some(wait) = reply.retry_after {
                        response = response.with_header(
                            tiny_http::Header::from_bytes(&b"Retry-After"[..], wait.as_bytes())
                                .expect("a valid header"),
                        );
                    }
                    let _ = request.respond(response);
                }
            });

            Self {
                base: format!("http://127.0.0.1:{port}/v1"),
                seen,
                handle,
            }
        }

        fn requests(&self) -> Vec<Seen> {
            let _ = &self.handle;
            self.seen.lock().expect("recorder").clone()
        }
    }

    fn shortlist() -> Shortlist {
        Shortlist {
            criterion: "kaygı".into(),
            candidates: vec![Shortlisted {
                candidate: 1,
                cues: vec![(41, "kaygı duyuyorum".into()), (42, "ve endişe".into())],
            }],
            left_out: 0,
            truncated: vec![],
        }
    }

    const ANSWER: &str = r#"{"order":[{"candidate":1,"reason":"kaygıyı anlatıyor","cues":[41]}]}"#;

    fn chat_response(content: &str) -> String {
        serde_json::json!({
            "choices": [{ "message": { "role": "assistant", "content": content } }]
        })
        .to_string()
    }

    #[test]
    fn ranks_through_a_stub_server_and_sends_the_prompt_it_built() {
        let stub = Stub::start(vec![reply(200, &chat_response(ANSWER))]);
        let client = OpenAiClient::local(&stub.base, "test-model");

        let answer = client.rank(&shortlist()).expect("the stub answers");

        assert_eq!(answer.order.len(), 1);
        assert_eq!(answer.order[0].candidate, 1);
        assert_eq!(answer.order[0].reason, "kaygıyı anlatıyor");

        let requests = stub.requests();
        assert_eq!(requests.len(), 1);
        assert!(requests[0].url.ends_with("/v1/chat/completions"), "{}", requests[0].url);

        let body = &requests[0].body;
        assert!(body.contains(r#""model":"test-model""#), "{body}");
        assert!(body.contains(r#""temperature":0.0"#), "{body}");
        assert!(body.contains(r#""top_p":1.0"#), "{body}");
        assert!(body.contains("Criterion: kaygı"), "{body}");
        assert!(body.contains("#41 kaygı duyuyorum"), "{body}");
        // The rule the prompt is built to keep: no timecode and no path.
        assert!(!body.contains("/videos/"), "{body}");
    }

    #[test]
    fn a_dead_port_is_unreachable_and_names_the_address() {
        let client = OpenAiClient::local("http://127.0.0.1:1/v1", "test-model");

        let error = client.rank(&shortlist()).unwrap_err();

        match error {
            ProviderError::Unreachable { address } => {
                assert_eq!(address, "http://127.0.0.1:1/v1");
            }
            other => panic!("expected Unreachable, got {other:?}"),
        }
    }

    #[test]
    fn a_429_is_retried_once_and_the_second_answer_is_used() {
        let mut busy = reply(429, "slow down");
        busy.retry_after = Some("0".into());
        let stub = Stub::start(vec![busy, reply(200, &chat_response(ANSWER))]);

        let client = OpenAiClient::local(&stub.base, "test-model").with_retry_wait(Duration::ZERO);
        let answer = client.rank(&shortlist()).expect("the retry answers");

        assert_eq!(answer.order.len(), 1);
        assert_eq!(stub.requests().len(), 2, "one retry, not two");
    }

    #[test]
    fn a_500_stops_after_one_retry_and_says_what_came_back() {
        let stub = Stub::start(vec![reply(500, "boom"), reply(500, "boom again")]);

        let client = OpenAiClient::local(&stub.base, "test-model").with_retry_wait(Duration::ZERO);
        let error = client.rank(&shortlist()).unwrap_err();

        assert_eq!(stub.requests().len(), 2, "one retry, then stop");
        match error {
            ProviderError::Http { status, message } => {
                assert_eq!(status, 500);
                assert!(message.contains("boom again"), "{message}");
            }
            other => panic!("expected Http, got {other:?}"),
        }
    }

    #[test]
    fn a_refused_key_is_an_auth_failure_and_a_4xx_is_not_retried() {
        let stub = Stub::start(vec![reply(401, r#"{"error":"bad key"}"#)]);

        let client = OpenAiClient::cloud(&stub.base, "test-model", "sk-test");
        let error = client.rank(&shortlist()).unwrap_err();

        assert!(matches!(error, ProviderError::Auth { .. }), "{error:?}");
        assert_eq!(stub.requests().len(), 1, "a refused key is not retried");
    }

    #[test]
    fn a_cloud_request_carries_the_key_and_the_identical_body() {
        let local = Stub::start(vec![reply(200, &chat_response(ANSWER))]);
        let local_client = OpenAiClient::local(&local.base, "deepseek-chat");
        local_client.rank(&shortlist()).expect("the local stub answers");

        let cloud = Stub::start(vec![reply(200, &chat_response(ANSWER))]);
        let cloud_client = OpenAiClient::cloud(&cloud.base, "deepseek-chat", "sk-test");
        cloud_client.rank(&shortlist()).expect("the cloud stub answers");

        let local_request = &local.requests()[0];
        let cloud_request = &cloud.requests()[0];

        // The same request either way: one shape covers both.
        assert_eq!(local_request.body, cloud_request.body);

        // The key is the only difference, and it travels as a bearer token.
        assert_eq!(local_request.authorization, None);
        assert_eq!(
            cloud_request.authorization.as_deref(),
            Some("Bearer sk-test")
        );
    }

    #[test]
    fn the_addresses_the_interface_offers_are_named_here() {
        assert!(OLLAMA_BASE.starts_with("http://127.0.0.1:"));
        assert!(LM_STUDIO_BASE.starts_with("http://127.0.0.1:"));
        assert!(DEEPSEEK_BASE.starts_with("https://api.deepseek.com"));
    }

    #[test]
    fn a_refused_key_is_not_repeated_back_in_the_error() {
        let stub = Stub::start(vec![reply(
            401,
            r#"{"error":"invalid api key sk-test"}"#,
        )]);

        let client = OpenAiClient::cloud(&stub.base, "test-model", "sk-test");
        let error = client.rank(&shortlist()).unwrap_err();

        let text = error.to_string();
        assert!(!text.contains("sk-test"), "{text}");
        assert!(text.contains("[redacted]"), "{text}");
    }

    #[test]
    fn the_debug_view_does_not_print_the_key() {
        let client = OpenAiClient::cloud(DEEPSEEK_BASE, "deepseek-chat", "sk-test");

        let text = format!("{client:?}");

        assert!(!text.contains("sk-test"), "{text}");
        assert!(text.contains("[redacted]"), "{text}");
    }

    #[test]
    fn the_models_a_server_serves_are_listed() {
        let stub = Stub::start(vec![reply(
            200,
            r#"{"data":[{"id":"qwen2.5:7b"},{"id":"llama3.2"}]}"#,
        )]);

        let client = OpenAiClient::local(&stub.base, "test-model");
        let models = client.models().expect("the stub lists its models");

        assert_eq!(models, vec!["qwen2.5:7b".to_string(), "llama3.2".to_string()]);
        assert!(stub.requests()[0].url.ends_with("/v1/models"));
    }
}
