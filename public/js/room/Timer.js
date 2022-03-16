class Timer{
    constructor(player, roomId, minutes, seconds, updateTimerCallback, timerEndedCallback){
        this.player = player;
        this.roomId = roomId;
        this.minutes = minutes;
        this.seconds = seconds;
        this.interval = null;
        this.updateTimerCallback = updateTimerCallback;
        this.timerEndedCallback = timerEndedCallback
    }

    start(){
        this.interval = setInterval(() => {
            this.seconds--;

            if(this.minutes === 0 && this.seconds === 0){
                this.stop()
                this.timerEndedCallback();
                return;
            }

            if(this.seconds < 0){
                this.minutes--;

                this.seconds = 59;
            }

            socket.emit('update-timer', roomId, this.minutes, this.seconds);
            this.updateTimerCallback(this.player, this.minutes, this.seconds)
        }, 1000)
    }

    stop(){
        clearInterval(this.interval)
        this.interval = null
    }
}