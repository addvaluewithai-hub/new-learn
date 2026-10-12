/** What the learner sees when talking to Nova fails to start. */
export const reason = (error: unknown) =>
  error instanceof Error && error.name === 'NotAllowedError'
    ? 'اسمح بالميكروفون من المتصفح، أو اكتب سؤالك.'
    : error instanceof Error
      ? error.message
      : 'تعذّر الكلام مع Nova.';
