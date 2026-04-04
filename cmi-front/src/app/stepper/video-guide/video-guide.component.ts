import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'video-guide-component',
  templateUrl: './video-guide.component.html',
  styleUrls: ['./video-guide.component.scss']
})
export class VideoGuideComponent {

  @Input() videoEnded: boolean = false;

  onVideoEnded() {
    this.videoEnded = true;
  }
}
