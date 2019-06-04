import {Server} from './server';

export class Api {
  id: string;
  name: string;
  progress: number;
  totalProgress: number;
  servers: Server[];
}
