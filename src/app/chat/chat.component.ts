import { Component, OnInit } from '@angular/core';
import {SocketService} from "../services/socket.service";
import {ToneAnalyzerService} from "../services/tone-analyzer.service";
import {_sanitizeHtml} from "@angular/core/src/sanitization/html_sanitizer";

export class Message{
  readonly senderId: string;
  public senderName: string;
  public message: string;
  public media: string | ArrayBuffer;
  public mood: string;
  readonly to: string;
  readonly timeStamp: Date;
  readonly type: string;
  constructor(message: string, media: string | ArrayBuffer, to: string, timeStamp: Date, type: string, mood?: string, senderId?: string, senderName?: string){
    this.message = message;
    this.senderId = senderId;
    this.senderName = senderName;
    this.to = to;
    this.timeStamp = timeStamp;
    this.type = type;
    this.media = media;
    this.mood = mood;
  }

  get timeStampString(): string{
    return this.timeStamp.toLocaleString();
  }
}

export class Chatroom{
  readonly name: string;
  readonly id: string;
  readonly type: string;
  public isMember: boolean;
  public messages: Message[] = [];
  public users: User[] = [];
  public last_msg: Date;

  constructor(name, id, type: string, isMember: boolean){
    this.id = id;
    this.name = name;
    this.type = type;
    this.isMember = isMember;
  }

  pushMessage(message: Message){
    this.messages.push(message);
    this.last_msg = message.timeStamp;
  }

  pushUser(user: User){
    this.users.push(user);
  }
  popUser(user: string){
    this.users.splice(this.users.findIndex((u: any)=>{
      if (u){
        return u.equals(user)
      }
      }), 1);
  }
  findUserById(id: string){
    let index = this.users.findIndex((u: User) => {return u.id == id});
    return this.users[index];
  }
}

export class User {
  public name: string;
  readonly id: string;
  public image: string | ArrayBuffer;

  constructor(name, id: string, image: string | ArrayBuffer){
    this.name = name;
    this.id = id;
    this.image = image;
  }

  equals(id: string){
    return id == this.id;
  }
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {

  public selected: string = 'global';
  public file: string | ArrayBuffer;
  public message: string;
  public alertMessage: string = "";
  public positive: boolean;
  public typeFile: boolean = false;
  public moods = ['Red', 'OrangeRed', 'Coral', 'Orange', 'Gold', 'Yellow', 'GreenYellow', 'Lawngreen', 'YellowGreen', 'LimeGreen', 'Green'];
  public chatrooms: any = {'global': new Chatroom('global', 'global','group', true )};

  constructor(private socketService: SocketService, private toneAnalyzer: ToneAnalyzerService) {
    this.socketService._socket.on('user connected', (user, id, image) => {
      this.chatrooms.global.pushUser(new User(user, id, image));
      this.sendAlert('user ' + user + ' connected', true);
    });
    this.socketService._socket.on('connected users', (users) => {
      users.map((user) => {this.chatrooms.global.pushUser(user)});
    });
    this.socketService._socket.on('existing groups', (groups) => {
      groups.map((group) => {
        this.chatrooms[group.id] = new Chatroom(group.id, group.id, 'group', false);
        group.users.map( user => this.chatrooms[group.id].pushUser(this.chatrooms['global'].findUserById(user)));
      });
    });
    this.socketService._socket.on('group message', (msg) => {
      this.toneAnalyzer.moodify(msg.mood.mood);
      this.chatrooms[msg.to].pushMessage(new Message(msg.message, msg.media, msg.to, new Date(msg.timeStamp), msg.type, msg.mood.mood, msg.senderId, msg.senderName));
    });
    this.socketService._socket.on('personal message', (msg) => {
      let message = new Message(msg.message, msg.file, msg.to, new Date(msg.timeStamp), msg.type, msg.mood.mood, msg.senderId, msg.senderName);
      this.toneAnalyzer.moodify(msg.mood.mood);
      if (!this.chatrooms[msg.senderId]){
        this.chatrooms[msg.senderId] = new Chatroom(msg.senderName, msg.senderId, 'personal', true);
        this.chatrooms[msg.senderId].pushUser(this.chatrooms['global'].findUserById(msg.senderId));
      }
      this.chatrooms[msg.senderId].pushMessage(message);
    });
    this.socketService._socket.on('group created', (name, userId) => {
      this.chatrooms[name] = new Chatroom(name, name, 'group', false);
      this.chatrooms[name].pushUser(this.chatrooms['global'].findUserById(userId));
    });
    this.socketService._socket.on('user joined', (name, userId) => {
      this.chatrooms[name].pushUser(this.chatrooms['global'].findUserById(userId));
    });
    this.socketService._socket.on('user disconnected', (user, id) => {
      this.sendAlert('user ' + user + ' disconnected', false)
      for (let chatroom in this.chatrooms) {
        this.chatrooms[chatroom].popUser(id);
      }
    });
  }

  ngOnInit() {
  }

  onClickSend(){
    var messageObj: Message = new Message(this.message, this.file, this.selected, new Date(), this.chatrooms[this.selected].type);
    this.chatrooms[this.selected].messages.push(messageObj);
    this.socketService.sendMessage(messageObj);
    this.message = '';
    this.file == null;
  }

  onClickCreateGroup(){
    var name = prompt('Please enter the chatroom name','Blob');
    if (name != null && name != "" && this.chatrooms[name]) {
      alert("Chatroom " + name + " existiert bereits!");
    }
    this.chatrooms[name] = new Chatroom(name, name, 'group', true);
    this.selected = name;
    this.socketService.createRoom(name);
  }

  onClickJoinGroup() {
    this.chatrooms[this.selected].isMember = true;
    this.socketService.joinRoom(this.selected);
  }

  onClickPrivateMessage(to: User){
    this.chatrooms[to.id] = new Chatroom(to.name, to.id, 'personal', true);
    this.selected = to.id;
    this.chatrooms[to.id].pushUser(to);
  }

  onFileSelect(event){
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      this.file = reader.result;
    }, false);
    if (event.target.files[0]) {
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  private sendAlert(msg: string, positive: boolean){
    this.positive = positive;
    this.alertMessage = msg;
    setTimeout(() => {
      this.alertMessage = null;
    }, 2000);
  }
  switchMode(event){
    event.preventDefault();
    this.typeFile = !this.typeFile;
  }

  get ConservationMood(){
    return this.moods[this.toneAnalyzer.ConversationMood];
  }
}
