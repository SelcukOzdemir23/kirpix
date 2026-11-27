import type { copy } from '../i18n/copy';
import Button from '../components/Button';
import CriterionCards from '../components/CriterionCards';
import TopicInputs from '../components/TopicInputs';
import { parseTerms } from '../state/useSearch';

type Props = {
  t: (typeof copy)['tr'];
  terms: string;
  minSec: number;
  maxSec: number;
  searching: boolean;
  onTerms: (value: string) => void;
  onMin: (value: number) => void;
  onMax: (value: number) => void;
  onSearch: () => void;
};

/**
 * A recording is open and nothing has been searched (data-model.md, state
 * `criterion`): the question, the five cards, the topic's inputs, and one
 * primary action, disabled while there is no word to search for (001 FR-005).
 */
export default function CriterionScreen(props: Props) {
  const { t } = props;
  const empty = parseTerms(props.terms).length === 0;
  const search = () => {
    if (!empty && !props.searching) props.onSearch();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
      <h1 className="text-[24px] font-bold tracking-[-0.01em]">{t.question}</h1>
      <CriterionCards t={t} selected="topic" />
      <TopicInputs
        t={t}
        terms={props.terms}
        minSec={props.minSec}
        maxSec={props.maxSec}
        onTerms={props.onTerms}
        onMin={props.onMin}
        onMax={props.onMax}
        onSubmit={search}
        action={
          <Button kind="primary" type="submit" disabled={empty || props.searching}>
            {props.searching ? t.searching : t.search}
          </Button>
        }
      />
    </div>
  );
}
