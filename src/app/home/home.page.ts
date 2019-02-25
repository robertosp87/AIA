import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Events, Content } from 'ionic-angular';
import { ChatService, ChatMessage, UserInfo } from "../../providers/chat-service";
import { IonicPage, NavParams } from 'ionic-angular';
import{ SpeechRecognition } from '@ionic-native/speech-recognition/ngx'


@IonicPage()
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild('scrollMe') content: Content;
  @ViewChild('chat_input') messageInput: ElementRef;
  msgList: ChatMessage[] = [];
  user: UserInfo;
  toUser: UserInfo;
  editorMsg = '';
  matches: string[];
  isRecording = false;

  constructor(private chatService: ChatService,
    private events: Events, private speechRecognition: SpeechRecognition, private cd: ChangeDetectorRef ) {
    // Get the navParams toUserId parameter
    this.toUser = {
      id: '210000198410281948',
      name: 'AIA'
    };
    // Get mock user information
    this.chatService.getUserInfo()
      .then((res) => {
        this.user = res
      });

      this.getPermissions();
  }

  ionViewWillLeave() {
    // unsubscribe
    this.events.unsubscribe('chat:received');
  }

  ionViewDidEnter() {
    //get message list
    this.getMsg();

    // Subscribe to received  new message events
    this.events.subscribe('chat:received', msg => {
      this.pushNewMsg(msg);
    })
  }


  /**
   * @name getMsg
   * @returns {Promise<ChatMessage[]>}
   */
  getMsg() {
    // Get mock message list
    return this.chatService
      .getMsgList()
      .subscribe(res => {
        this.msgList = res;
        this.scrollToBottom();
      });
  }

  /**
   * @name sendMsg
   */
  sendMsg() {
    console.log("Vai Enviar a Msg")

      if (!this.editorMsg.trim()) return;

    // Mock message
    const id = Date.now().toString();
    let newMsg: ChatMessage = {
      messageId: Date.now().toString(),
      userId: this.user.id,
      userName: this.user.name,
      userAvatar: this.user.avatar,
      toUserId: this.toUser.id,
      time: Date.now(),
      message: this.editorMsg,
      status: 'pending'
    };

    this.pushNewMsg(newMsg);
    this.editorMsg = '';

    this.chatService.sendMsg(newMsg)
      .then(() => {
        let index = this.getMsgIndexById(id);
        if (index !== -1) {
          this.msgList[index].status = 'success';
        }
      })
  }

  /**
   * @name pushNewMsg
   * @param msg
   */
  pushNewMsg(msg: ChatMessage) {
    const userId = this.user.id,
      toUserId = this.toUser.id;
    // Verify user relationships
    if (msg.userId === userId && msg.toUserId === toUserId) {
      this.msgList.push(msg);
    } else if (msg.toUserId === userId && msg.userId === toUserId) {
      this.msgList.push(msg);
    }
    this.scrollToBottom();
  }

  getMsgIndexById(id: string) {
    return this.msgList.findIndex(e => e.messageId === id)
  }

  scrollToBottom() {

    console.log(this.content)
    setTimeout(() => {
      if (this.content.scrollToBottom) {
        this.content.scrollToBottom();
      }
    }, 400)
  }

  private focus() {
    if (this.messageInput && this.messageInput.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }

  private setTextareaScroll() {
    const textarea = this.messageInput.nativeElement;
    textarea.scrollTop = textarea.scrollHeight;
  }

  startListening() {

    this.isRecording = false;

    let options = {
       language: 'pt-BR' , 
       showPopup: true
      
    }
    
    this.isRecording = true;
    this.speechRecognition.startListening(options).subscribe(matches => {
      this.matches = matches;
      this.cd.detectChanges();
      this.editorMsg = this.matches[0];
      this.sendMsg();
      this.stopListening();
    });
  }

  stopListening() {
    this.isRecording = false;
  }

  getPermissions() {
    this.speechRecognition.hasPermission()
      .then((hasPermission: boolean) => {
        if(!hasPermission) {
          this.speechRecognition.requestPermission();
        }
        
      });
    }

}

