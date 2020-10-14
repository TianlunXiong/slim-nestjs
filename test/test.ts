import App from '../src';
import './controllers';

const app = new App();
app.listen(9001, () => console.log('ok'));

