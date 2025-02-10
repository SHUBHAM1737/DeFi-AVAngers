import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

declare global {
  var supabaseClient: SupabaseClient;
}

interface SearchResult {
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export class VectorStore {
  private embeddings: OpenAIEmbeddings;
  private store: SupabaseVectorStore | null = null;
  private namespace: string;

  constructor(namespace: string = 'default') {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-large",
    });
    this.namespace = namespace;
  }

  async initialize() {
    if (!global.supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    // Initialize vector store
    this.store = await SupabaseVectorStore.fromTexts(
      ['Initial vector store setup'],
      [{ source: 'initialization' }],
      this.embeddings,
      {
        client: global.supabaseClient,
        tableName: 'documents',
        queryName: 'match_documents',
      }
    );
  }

  async addDocuments(texts: string[], metadata: Record<string, unknown>[]) {
    if (!this.store) {
      throw new Error('Vector store not initialized');
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const documents = await splitter.createDocuments(
      texts,
      metadata.map(m => ({ ...m, namespace: this.namespace }))
    );

    await this.store.addDocuments(documents);
  }

  async similaritySearch(query: string, k: number = 4): Promise<SearchResult[]> {
    if (!this.store) {
      throw new Error('Vector store not initialized');
    }

    const results = await this.store.similaritySearchWithScore(query, k, {
      filter: (doc: Document) => {
        const metadata = doc.metadata as { namespace?: string };
        return metadata.namespace === this.namespace;
      },
    });

    return results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      similarity: score,
    }));
  }

  async deleteDocuments(filter: Record<string, unknown>) {
    if (!this.store) {
      throw new Error('Vector store not initialized');
    }

    await this.store.delete({
      filter: {
        ...filter,
        namespace: this.namespace,
      },
    });
  }

  async clearNamespace() {
    await this.deleteDocuments({});
  }
}

// Create vector stores for different purposes
export const marketKnowledge = new VectorStore('market');
export const technicalKnowledge = new VectorStore('technical');
export const userKnowledge = new VectorStore('user');