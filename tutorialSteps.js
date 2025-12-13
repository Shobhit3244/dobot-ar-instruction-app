const tutorialSteps = [
  { title: "Power ON", text: "Press the power button on Dobot.", highlight: "power_button" },
  { title: "Status Check", text: "Wait until the indicator turns green.", highlight: "status_led" },
  { title: "Connect Software", text: "Open Dobot Studio, select COM port, click Connect.", highlight: null },
  { title: "Teaching Mode", text: "Select Teaching & Playback mode.", highlight: null },
  { title: "New File", text: "Click New File and choose Discard.", highlight: null },
  { title: "Select Tool", text: "Choose Suction Cup tool.", highlight: "suction_cup" },
  { title: "Teach Button", text: "Press the button on top of the robot.", highlight: "teach_button" },
  { title: "Record Point", text: "Move robot by hand and release to record.", highlight: "end_effector" },
  { title: "Pick Object", text: "Lower onto object and release.", highlight: "suction_cup" },
  { title: "Enable Suction", text: "Set SuctionCupOn in the motion list.", highlight: null },
  { title: "Move to Drop", text: "Move arm to drop position with suction ON.", highlight: "trajectory" },
  { title: "Start Playback", text: "Press Start to execute.", highlight: null },
  { title: "Shutdown", text: "Exit, disconnect and power off.", highlight: "power_button" }
];
