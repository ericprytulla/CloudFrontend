import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ToneAnalyzerService {
  private apiUrl: string = "/tone";
  private mood: number = 10;
  private max: number = 10;
  private min: number = 0;
  headers = new HttpHeaders();

  constructor(private http: HttpClient) {
  }

  moodify(mood: string) {
    console.log(mood);
    switch (mood) {
      case 'happy':
        if (this.mood < this.max) {
          this.mood++;
        }
        break;
      case 'unhappy':
        if (this.mood > this.min) {
          this.mood--;
        }
        break;
    }
  }

  get ConversationMood(): number {
    return this.mood;
  }

}
