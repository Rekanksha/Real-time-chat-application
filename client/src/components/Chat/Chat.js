import React , {useState, useEffect} from 'react';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import io from 'socket.io-client';
import './chat.css';
import Input from '../Input/Input'; 
import Infobar from '../Infobar/Infobar';
import Messages from '../Messages/Messages';
import TextContainer from '../TextContainer/TextContainer';
let socket;
const Chat=()=>{
      const location = useLocation();
      const [name,setName]=useState('');
      const[room,setRoom]=useState('');
      const [users, setUsers] = useState('');
      const[message,setMessage]=useState('');
      const[messages,setMessages]=useState([]);
      const ENDPOINT = window.location.origin;
    useEffect(()=>{
        const {name,room}=queryString.parse(location.search);
        socket=io(ENDPOINT);
        setName(name);
        setRoom(room);
        socket.emit('join',{name,room},()=>{
        });
        return ()=>{
          socket.emit('disconnect');
          socket.off();
        };
    },[ENDPOINT,location.search]);

    useEffect(() => {
    socket.once("message", (message) => {
      setMessages([...messages, message]);
    });
    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });
  }, [messages]);
    // function for sending messages
    const sendMessage=(event)=>{
       event.preventDefault();
       if(message)
       {
          socket.emit('sendMessage',message,()=>setMessage(''));
       }
    }
    console.log({message,messages});
    return (
        <div className='outerContainer'>
            <div className='container'>
                <Infobar room ={room}/>
                <Messages messages={messages} name={name}/>
                <Input message={message} setMessage={setMessage} sendMessage={sendMessage} />
                {/* <input 
                 value={message}
                 onChange={(event)=>setMessage(event.target.value)}
                 onKeyDown={event=>event.key==='Enter'?sendMessage(event):null}
                /> */}
            </div>
            <TextContainer users={users}/>
        </div>
    )
}
export default Chat;