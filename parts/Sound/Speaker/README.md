# Speaker

It is a speaker such as piezo. Connect with two wires, and generate sound by current.

## wired(obniz , {signal. gnd} )
Connect to the speaker. If there are plus and minus, please specify minus to gnd.

![](./wired.png)
```Javascript
var speaker = obniz.wired("Speaker", {signal:0, gnd:1});
```
## play(frequency)
Specify the frequency of the sound from the speaker.

```Javascript
var speaker = obniz.wired("Speaker", {signal:0, gnd:1});
speaker.play(1000); //1000hz
```

## stop()
stop playing.
```Javascript
var speaker = obniz.wired("Speaker", {signal:0, gnd:1});
speaker.play(1000); //1000hz
obniz.wait(1000);
speaker.stop();
```