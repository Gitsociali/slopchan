import styles from './loading-ellipsis.module.css';

interface LoadingEllipsisProps {
  string: string;
}

const TRAILING_ELLIPSIS_PATTERN = /\s*(?:\.\.\.|\u2026)\s*$/;

const LoadingEllipsis = ({ string }: LoadingEllipsisProps) => {
  const normalizedString = string.replace(TRAILING_ELLIPSIS_PATTERN, '');
  const words = normalizedString.split(' ');
  const lastWord = words.pop();
  const restOfString = words.join(' ');

  return (
    <span>
      {restOfString}
      {restOfString && ' '}
      <span className={styles.nowrap}>
        {lastWord}
        <span className={styles.ellipsis} />
      </span>
    </span>
  );
};

export default LoadingEllipsis;
