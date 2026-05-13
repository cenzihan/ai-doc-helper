export type RuntimeConfig = {
  API_KEY?: string;
};

declare global {
  interface Window {
    __AI_DOC_CONFIG__?: RuntimeConfig;
  }
}

export const getRuntimeApiKey = () => window.__AI_DOC_CONFIG__?.API_KEY || process.env.API_KEY || '';
