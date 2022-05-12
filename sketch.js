let MLstate="start";
let lastMLstate="";
let PIRstate=0;
let statecount = 0;

// MQTT client details:
let broker = {
    hostname: 'public.cloud.shiftr.io',
    port: 443
};
// MQTT client:
let client;
// client credentials:
let creds = {
    clientID: 'DSp5Client',
    userName: 'public',
    password: 'public'
}
// topic to subscribe to when you connect:
let topic = 'HA/101/Activity/0';

// a pushbutton to send messages
let sendButton;
let localDiv;
let remoteDiv;

// intensity of the circle in the middle
let intensity = 255;

//----------------

// Classifier Variable
let classifier;
// Model URL
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/Bm99Po00p/'; //活動2

//'https://teachablemachine.withgoogle.com/models/tbXzsovHA/'; //活動

//'https://teachablemachine.withgoogle.com/models/lTEybgxc4/'; //人數

//'https://teachablemachine.withgoogle.com/models/3s0UbtxfL/'; //?



 
// Video
let video;
let flippedVideo;
// To store the classification
let label = "";

// Load the model first
function preload() {
  classifier = ml5.imageClassifier(imageModelURL + 'model.json');
}
//----------------

function setup() {
  createCanvas(800, 500);
  
  video = createCapture(VIDEO);
  video.size(800, 500);
  video.hide();

  flippedVideo = ml5.flipImage(video)
  // Start classifying
  classifyVideo();
  
    // Create an MQTT client:
    client = new Paho.MQTT.Client(broker.hostname, Number(broker.port), creds.clientID);
    // set callback handlers for the client:
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    // connect to the MQTT broker:
    client.connect(
        {
            onSuccess: onConnect,       // callback function for when you connect
            userName: creds.userName,   // username
            password: creds.password,   // password
            useSSL: true                // use SSL
        }
    );
    // create the send button:
    sendButton = createButton('send a state');
    sendButton.position(20, 150);
    sendButton.mousePressed(sendMqttMessage);
    // create a div for local messages:
    localDiv = createDiv('local messages will go here');
    localDiv.position(20, 170);
    localDiv.style('color', '#fff');
    // create a div for the response:
    remoteDiv = createDiv('waiting for messages');
    remoteDiv.position(20, 185);
    remoteDiv.style('color', '#fff');
}

function draw() {
  //statecount=statecount+1;
//   if(statecount%2==0){
//      let imageModelURL = 'https://teachablemachine.withgoogle.com/models/lTEybgxc4/';//人數
//      }else{
//        let imageModelURL =   
// 'https://teachablemachine.withgoogle.com/models/tbXzsovHA/'; //活動
//      }
  
  
    background(0);
    // draw a circle whose brightness changes when a message is received:
    fill(intensity);
    circle(width/2, height/2, width/2);
// subtract one from the brightness of the circle:
    if (intensity > 0) {
        intensity--;
    }
  
  image(flippedVideo, 0, 0);

  // Draw the label
  fill(255);
  textSize(30);
  textAlign(CENTER);
  text(MLstate, width / 2, height-15);
  //text(MLstate2, width / 2, height-100);
  
  let emoji = "🔘";
  if (label == "lecture") {
    MLstate="lecture";
    emoji = "👨‍🏫";
    if(lastMLstate!="lecture"){      
      lastMLstate="lecture";      
      sendMqttMessage();
       }
    
  } else if (label == "party") {
    MLstate="party";
    emoji = "👨‍👧‍👦";
    if(lastMLstate!="party"){      
      lastMLstate="party";      
      sendMqttMessage();
       }
  } else if (label == "noone") {
    MLstate="noone";
    emoji = "🔘";
    if(lastMLstate!="noone"){      
      lastMLstate="noone";      
      sendMqttMessage();
       }
  } else if (label == "review") {
    MLstate="review";
    emoji = "📝";
     if(lastMLstate!="review"){      
      lastMLstate="review";      
      sendMqttMessage();
       }
  } 
  
  //arduino
  let emojiPIR = "🔘";
  if (PIRstate == 1) {
    emojiPIR = "🚶";
  } else if (PIRstate == 0) {
    emojiPIR = "⬜";
  }

  // Draw the emoji
  textSize(50);
  text(emoji, width/2, height*0.85);
  text(emojiPIR, width-50, height*0.85);

}

// called when the client connects
function onConnect() {
    localDiv.html('client is connected');
    client.subscribe(topic);
}

// called when the client loses its connection
function onConnectionLost(response) {
    if (response.errorCode !== 0) {
        localDiv.html('onConnectionLost:' + response.errorMessage);
    }
}

// called when a message arrives
function onMessageArrived(message) {
    remoteDiv.html('I got a message:' + message.payloadString);
    let  incomingNumber = parseInt(message.payloadString);
    /*if (incomingNumber > 0) {
        intensity = 255;
    }*/
    if ( incomingNumber == "1") {
        PIRstate=1;
    }else if ( incomingNumber == "0") {
        PIRstate=0;
    }
}

// Get a prediction for the current video frame
function classifyVideo() {
  flippedVideo = ml5.flipImage(video)
  classifier.classify(flippedVideo, gotResult);
}

// When we get a result
function gotResult(error, results) {
  // If there is an error
  if (error) {
    console.error(error);
    return;
  }
  // The results are in an array ordered by confidence.
  // console.log(results[0]);
  label = results[0].label;
  // Classifiy again!
  classifyVideo();
}

// called when you want to send a message:
function sendMqttMessage() {
    // if the client is connected to the MQTT broker:
    if (client.isConnected()) {
        // make a string with a random number form 0 to 15:
        let msg = MLstate;
        // start an MQTT message:
        message = new Paho.MQTT.Message(msg);
        // choose the destination topic:
        message.destinationName = topic;
        // send it:
        client.send(message);
        // print what you sent:
        localDiv.html('I sent: ' + message.payloadString);
    }
}