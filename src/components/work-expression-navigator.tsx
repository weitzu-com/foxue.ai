import Link from "next/link";
import { ArrowRight, BookCopy, ChevronDown, Fingerprint } from "lucide-react";
import { getWorkExpressionGroup, type Sutra } from "@/data/sutras";
import styles from "./work-expression-navigator.module.css";

export function WorkExpressionNavigator({
  sutra,
  variant = "catalog",
}: {
  sutra: Sutra;
  variant?: "catalog" | "reader";
}) {
  const group = getWorkExpressionGroup(sutra.slug);
  if (!group) return null;

  const languageCount = new Set(group.expressions.map((expression) => expression.language)).size;
  const titleId = `work-expressions-${sutra.slug}`;

  return (
    <section
      className={`${styles.navigator} ${styles[variant]}`}
      aria-labelledby={titleId}
      data-work-expression-navigator
      data-work-expression-count={group.expressions.length}
      data-work-expression-variant={variant}
    >
      <details className={styles.disclosure}>
        <summary className={styles.header}>
          <div className={styles.headingMark} aria-hidden="true">
            <BookCopy />
            <span>{String(group.expressions.length).padStart(2, "0")}</span>
          </div>
          <div className={styles.headingCopy}>
            <p>同一作品 · TEXTUAL EXPRESSIONS</p>
            <h2 id={titleId}>同一作品，保留不同表达。</h2>
            <span>
              {group.expressions.length} 种可读文本表达 · {languageCount} 种语文。异译、节本、版本与数字见证各自保留；
              共享作品标识不等于逐句相同，也不表示已经逐段对齐。
            </span>
          </div>
          <span className={styles.toggle}>
            查看全部 <ChevronDown aria-hidden="true" />
          </span>
        </summary>

        <ul className={styles.expressionGrid} aria-label="同一作品的可读文本表达">
          {group.expressions.map((expression) => {
            const current = expression.slug === sutra.slug;
            const content = (
              <>
                <span className={styles.expressionMeta}>
                  <em>{expression.language}</em>
                  <span>{current ? "当前阅读" : expression.status}</span>
                </span>
                <strong>{expression.alternateTitle}</strong>
                <small>{expression.canonRef}</small>
                <span className={styles.responsibility}>{expression.translator}</span>
                {!current && <ArrowRight aria-hidden="true" />}
              </>
            );

            return (
              <li key={expression.slug}>
                {current ? (
                  <span className={`${styles.expression} ${styles.current}`} aria-current="page">
                    {content}
                  </span>
                ) : (
                  <Link
                    className={styles.expression}
                    href={`/jingzang/${expression.slug}`}
                    prefetch={false}
                    data-analytics-event="scripture_expression_opened"
                    data-analytics-location={`work_expression_${variant}`}
                    data-analytics-content-id={expression.canonRef}
                    data-analytics-label={expression.alternateTitle}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <footer className={styles.footer}>
          <Fingerprint aria-hidden="true" />
          <span>稳定作品标识</span>
          <code>{group.workId}</code>
        </footer>
      </details>
    </section>
  );
}
