
export interface BookIDArgs {
  isbn: number,
  n?: number,
  salt?: string
}

export interface Book {
  title: string
  authors: [string]
  isbn: number
}

export interface JoloBook extends Book {
  did: string
}
