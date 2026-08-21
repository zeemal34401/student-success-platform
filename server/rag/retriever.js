/**
 * TF-IDF retriever adapted from the local rag-chat-system
 * (TfidfVectorizer + nearest-neighbour search; cosine similarity in place of FAISS L2).
 */

function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

function vectorize(tokens, idf) {
  const tf = new Map()
  for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1)
  const vec = new Map()
  const length = Math.max(tokens.length, 1)
  let norm = 0
  for (const [token, count] of tf) {
    const weight = (count / length) * (idf.get(token) ?? 0)
    vec.set(token, weight)
    norm += weight * weight
  }
  return { vec, norm: Math.sqrt(norm) || 1 }
}

export function buildTfidfIndex(documents) {
  const docs = documents.map((doc) => ({
    ...doc,
    tokens: tokenize(`${doc.question ?? ''} ${doc.answer ?? ''} ${doc.text ?? ''}`),
  }))

  const df = new Map()
  for (const doc of docs) {
    for (const token of new Set(doc.tokens)) {
      df.set(token, (df.get(token) ?? 0) + 1)
    }
  }

  const idf = new Map()
  const n = Math.max(docs.length, 1)
  for (const [token, count] of df) {
    idf.set(token, Math.log((n + 1) / (count + 1)) + 1)
  }

  const vectors = docs.map((doc) => vectorize(doc.tokens, idf))

  return {
    documents: docs,
    search(query, k = 5) {
      const queryVec = vectorize(tokenize(query), idf)
      return vectors
        .map((docVec, index) => {
          let dot = 0
          for (const [token, weight] of queryVec.vec) {
            dot += weight * (docVec.vec.get(token) ?? 0)
          }
          return { index, score: dot / (queryVec.norm * docVec.norm) }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .filter((row) => row.score > 0.02)
        .map((row) => ({
          question: docs[row.index].question,
          answer: docs[row.index].answer,
          source: docs[row.index].source ?? 'knowledge',
          score: Number(row.score.toFixed(4)),
        }))
    },
  }
}
