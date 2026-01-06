import { Component } from '@angular/core';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  template: `
    <section class="unauthorized">
      <h1>Unauthorized</h1>
      <p>You do not have access to this resource.</p>
    </section>
  `
})
export class UnauthorizedComponent {}
