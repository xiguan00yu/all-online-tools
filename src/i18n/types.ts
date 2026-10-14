/** Supported UI locales. Extend here when adding more languages. */
export type Locale = 'zh' | 'en'

/** Nested message tree; leaves are strings. */
export type MessageTree = { [key: string]: string | MessageTree }
