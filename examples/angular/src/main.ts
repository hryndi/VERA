import {Component} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  template: '<h1>VERA verification example</h1><p>{{ message }}</p>'
})
class App {
  readonly message = 'Angular compilation and strict type checking are configured.';
}

bootstrapApplication(App).catch(error => console.error(error));
