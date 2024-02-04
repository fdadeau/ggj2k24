
import { audio } from "./audio.js";

const TALK = "talk";

export class Dialog {

    constructor(texts) {
        this.state = -1;
        this.t0 = 0;
        let endTime = 0;
        this.texts = texts.map(t => { 
            endTime += t[2]
            return { who: t[0], what: t[1], duration: t[2], endTime };
        });
        this.speaker = -1;
    }

    update(dt) {
        if (this.state < 0) {
            return;
        }
        this.time = Date.now() - this.t0;
        if (this.time >= this.texts[this.state].endTime) {
            this.state++;
            if (this.state >= this.texts.length) {
                console.log("End dialog");
                audio.pause(TALK);
                this.state = -1;
                return;
            }
            // change of speaker
            if (this.soundOn && this.texts[this.state-1].who != this.texts[this.state].who) {
                audio.pause(TALK);
                if (this.state % 2 == 0) {
                    audio.playSound("speak1", TALK, 0.5, 1);
                }
                else {
                    audio.playSound("speak2", TALK, 1, 1);
                }
            }
        }
    }

    isRunning() {
        return this.state >= 0;
    }

    getDuration() {
        return this.texts[this.texts.length-1].endTime;
    }

    start(id, soundOn) {
        if (this.state < 0) {
            console.log("Start dialog", id);
            this.speaker = id;
            this.soundOn = soundOn;
            this.t0 = Date.now();
            this.state = 0; 
            if (soundOn) {
                if(this.texts[this.state] && this.texts[this.state].who == 1){
                    audio.playSound("speak1",TALK,0.5,true);
                }else{
                    audio.playSound("speak2",TALK,1,true);
                }
            }
        }
    }

    end() {
        this.state = -1;
        this.speaker = -1;
        audio.pause(4);
        audio.pause(5);
    }

    render(ctx, x0, y0, x1, y1, showtext) {
        if (this.state >= 0) {
            ctx.fillStyle = "white";
            ctx.strokeStyle = "red";
            ctx.font = "15px arial";
            ctx.lineWidth = 3;
            let [x, y, d] = this.texts[this.state].who == 0 ? [x0,y0,20] : [x1,y1,-20]; 
            let w = ctx.measureText(this.texts[this.state].what).width;
            if (w < 50) {
                w = 50;
            }
            const dy = 50;
            const pad = 10;
            ctx.beginPath();
            ctx.moveTo(x, y - 30);
            ctx.lineTo(x + d, y - dy);
            ctx.lineTo(x + w/2 + pad, y - dy);
            ctx.lineTo(x + w/2 + pad, y - dy - 30);
            ctx.lineTo(x - w/2 - pad, y - dy - 30);
            ctx.lineTo(x - w/2 - pad, y - dy);
            ctx.lineTo(x, y - dy);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
            if (showtext) {
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.verticalAlign = "middle";
                ctx.fillText(this.texts[this.state].what, x, y - dy - pad);
            }
        }
    }

}
