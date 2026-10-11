/**
 * Card: reusable Polaris-style card (INSTRUCTION.md section 6, reusable
 * components; STYLEGUIDE.md liquid glass tokens).
 *
 * Mirrors the Shopify Polaris Card anatomy: a rounded glass container cut
 * into rows by 1px dividers, with compound slots for the familiar dot
 * notation:
 *
 *   <Card>
 *     <Card.Header title="Store Connections" subheading="Manage your stores."
 *       actions={...} />
 *     <Card.Section title="Sync Settings"
 *       subheading="Products sync every hour.">...</Card.Section>
 *     <Card.Section>...</Card.Section>
 *     <Card.Footer actions={...}>Hint text.</Card.Footer>
 *   </Card>
 *
 * A `title`/`subheading`/`actions` triple on the root is a convenience that
 * renders the header for single-call usage (the new Polaris Card pattern:
 * a semibold heading with a muted subheading stacked beneath it). Headings
 * arrive in Title Case from the caller (section 7, rule 1); subheadings and
 * action buttons stay sentence case. Padding lives on the sections (Polaris behavior), so bare children should be
 * wrapped in Card.Section to avoid flush content. Styles live in
 * Card.module.css (true CSS modules; camelCase class names for dot
 * access).
 */

import type { ReactElement, ReactNode } from "react"

import cardStyles from "../../assets/styles/module/Card.module.css"

/** Surface tones (Polaris: base, secondary, transparent). */
type CardBackground = "base" | "secondary" | "transparent"

interface CardProps {
  /** Convenience that renders a Card.Header with this Title Case heading. */
  title?: string
  /** Muted supporting line rendered under the title (sentence case). */
  subheading?: string
  /** Convenience header actions, rendered on the right of the title. */
  actions?: ReactNode
  /** Surface tone. "base" is the frosted glass card. */
  background?: CardBackground
  /** Card.Header / Card.Section / Card.Footer slots, or bare content. */
  children: ReactNode
}

interface CardHeaderProps {
  /** Card heading in Title Case, e.g. "Store Connections". */
  title?: string
  /** Muted supporting line rendered under the title (sentence case). */
  subheading?: string
  /** Actions rendered on the right edge, typically buttons or links. */
  actions?: ReactNode
  /** Optional content rendered under the title block (badges, help text). */
  children?: ReactNode
}

interface CardSectionProps {
  /** Section heading in Title Case, e.g. "Sync Settings". */
  title?: string
  /** Muted supporting line rendered under the section title (sentence case). */
  subheading?: string
  /** Actions rendered on the right edge of the section heading row. */
  actions?: ReactNode
  /** Vertical rhythm: base = 16px padding, snap = 8px, none = flush. */
  padding?: "base" | "snap" | "none"
  children: ReactNode
}

interface CardSubsectionProps {
  children: ReactNode
}

interface CardFooterProps {
  /** Content on the left of the footer row (hints, status text). */
  children?: ReactNode
  /** Buttons on the right of the footer row. */
  actions?: ReactNode
}

/**
 * Join present class names, skipping empty strings so the default tone and
 * padding never leave stray whitespace in className.
 */
function joinClasses(...names: Array<string>): string {
  return names.filter(Boolean).join(" ")
}

/** Surface tone → CSS module class (camelCase keys for dot access). */
const BACKGROUND_CLASS: Record<"secondary" | "transparent", string> = {
  secondary: cardStyles.bgSecondary,
  transparent: cardStyles.bgTransparent,
}

/**
 * Card shell. Draws the container and, when the convenience title, subheading,
 * or actions props are used, a header row before the children. Dividers
 * between rows come from `.uiCard > * + *` in Card.module.css, matching the
 * Polaris section dividers.
 */
function CardRoot({
  title,
  subheading,
  actions,
  background = "base",
  children,
}: CardProps) {
  const backgroundClass =
    background === "base" ? "" : BACKGROUND_CLASS[background]
  const hasHeader = Boolean(title || subheading || actions)
  return (
    <section className={joinClasses(cardStyles.uiCard, backgroundClass)}>
      {hasHeader ? (
        <CardHeader
          title={title}
          subheading={subheading}
          actions={actions}
        />
      ) : null}
      {children}
    </section>
  )
}

/** Card header: heading block on the left, actions on the right. */
function CardHeader({ title, subheading, actions, children }: CardHeaderProps) {
  return (
    <header className={cardStyles.head}>
      <div className={cardStyles.headBlock}>
        {title ? <h2 className={cardStyles.title}>{title}</h2> : null}
        {subheading ? (
          <p className={cardStyles.subheading}>{subheading}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div className={cardStyles.actions}>{actions}</div> : null}
    </header>
  )
}

/** Section padding scale → CSS module class (camelCase keys for dot access). */
const PADDING_CLASS: Record<"snap" | "none", string> = {
  snap: cardStyles.paddingSnap,
  none: cardStyles.paddingNone,
}

/**
 * Card section: optional heading block above the content, divided from
 * sibling rows. The heading block stacks the Title Case title and its muted
 * subheading, with actions on the right edge (Polaris section anatomy).
 */
function CardSection({
  title,
  subheading,
  actions,
  padding = "base",
  children,
}: CardSectionProps) {
  const paddingClass = padding === "base" ? "" : PADDING_CLASS[padding]
  const hasHead = Boolean(title || subheading || actions)
  return (
    <div className={joinClasses(cardStyles.section, paddingClass)}>
      {hasHead ? (
        <div className={cardStyles.sectionHead}>
          <div className={cardStyles.sectionHeadBlock}>
            {title ? (
              <h3 className={cardStyles.sectionTitle}>{title}</h3>
            ) : null}
            {subheading ? (
              <p className={cardStyles.subheading}>{subheading}</p>
            ) : null}
          </div>
          {actions ? <div className={cardStyles.actions}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}

/** Nested block inside a section; siblings share a subtle divider. */
function CardSubsection({ children }: CardSubsectionProps) {
  return <div className={cardStyles.subsection}>{children}</div>
}

/** Card footer: hint content on the left, action buttons on the right. */
function CardFooter({ children, actions }: CardFooterProps) {
  return (
    <div className={cardStyles.footer}>
      {children ? <div className={cardStyles.footerContent}>{children}</div> : null}
      {actions ? <div className={cardStyles.actions}>{actions}</div> : null}
    </div>
  )
}

/**
 * The Card component type: a function carrying its Polaris-style compound
 * slots.
 */
interface CardComponent {
  (props: CardProps): ReactElement
  Header: typeof CardHeader
  Section: typeof CardSection
  Subsection: typeof CardSubsection
  Footer: typeof CardFooter
}

/**
 * Compose the compound Card. Object.assign keeps every part a plain
 * function declaration (INSTRUCTION.md section 5) while giving JSX the
 * familiar <Card.Header> dot notation.
 */
const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Section: CardSection,
  Subsection: CardSubsection,
  Footer: CardFooter,
}) satisfies CardComponent

export { Card }
export type {
  CardBackground,
  CardProps,
  CardHeaderProps,
  CardSectionProps,
  CardSubsectionProps,
  CardFooterProps,
}
