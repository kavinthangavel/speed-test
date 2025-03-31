// Basic declaration for @m-lab/ndt7 to satisfy TypeScript
declare module '@m-lab/ndt7' {
  // Define a basic structure for the client based on usage
  export class NDT7Client {
    constructor(config: {
      userAcceptedDataPolicy: boolean;
      mlabServer?: string;
      onError: (err: Error) => void;
    });

    startTest(testType: 'download' | 'upload', options: {
      onprogress: (data: { MeanClientMbps?: number }) => void;
    }): void;
    
    // Add other methods/properties if known or needed
  }
}