import { io } from "socket.io-client";

const socket = io("https://babybargains.onrender.com/");

export default socket;