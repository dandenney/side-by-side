declare module 'unfurl' {
  interface UnfurlResult {
    title?: string;
    description?: string;
    open_graph?: {
      images?: Array<{
        url: string;
      }>;
    };
    twitter_card?: {
      images?: Array<{
        url: string;
      }>;
    };
  }

  function unfurl(url: string): Promise<UnfurlResult>;
  export default unfurl;
} 