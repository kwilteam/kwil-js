import { Config } from '../../api_client/config';
import { Kwil } from '../kwil';

export class WebKwil extends Kwil {
  constructor(opts: Config) {
    super(opts);
  }
}
