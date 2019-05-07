import { Component, OnInit } from '@angular/core';
import {SocketService} from "../services/socket.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  username: string = null;
  password: string = null;
  repeat_password: string = null;
  preferred_language: string = 'de';
  image: string | ArrayBuffer = null;
  required: boolean = false;
  login: boolean = true;

  constructor(private socketService: SocketService) {

  }

  ngOnInit() {
  }

  onFileSelect(event){
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.image = reader.result;
    }, false);
    if (event.target.files[0]) {
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  onClickLogin(){
    if (this.username && this.username.length > 1 && this.username.length < 80){
      this.socketService.login(this.username, this.password);
    }
    this.required = true;
  }

  onClickRegister(){
    if (this.username && this.username.length > 1 && this.username.length < 80 && this.password === this.repeat_password){
      this.socketService.register(this.username, this.password, this.image, this.preferred_language);
    } else {
      this.required = true;
    }
  }
}
