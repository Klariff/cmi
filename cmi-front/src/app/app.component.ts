import { Component, OnInit } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'cmi-front';

  ngOnInit(): void {
    if (sessionStorage.getItem('loaded') == 'true') {
      sessionStorage.clear();
      location.reload();
    }
  }
}
