export interface Server {
  name: string;
  region: string;
  zone: string;
  location: string;
  status: string;
  progress: number;
  totalProgress: number;
  testType: string;
  executionType: string;
  regional: any;

  // fromAPIStatus(server: any) {
  //   this.name = server.name;
  //   this.region = server.region;
  //   this.
  // }
}
