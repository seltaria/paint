import React from "react";
import { observer } from "mobx-react-lite";
import "../styles/canvas.scss";
import canvasState from "../store/canvasState";
import toolState from "../store/toolState";
import Brush from "../tools/Brush";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useParams } from "react-router-dom";
import Rect from "../tools/Rect";
import axios from 'axios';
import Circle from "../tools/Circle";
import Eraser from "../tools/Eraser";
import Line from "../tools/Line";

export const Canvas = observer(() => {
  const canvasRef = React.useRef();
  const usernameRef = React.useRef();

  const [modal, setModal] = React.useState(true);

  const params = useParams();

  React.useEffect(() => {
    canvasState.setCanvas(canvasRef.current);
    let ctx = canvasRef.current.getContext('2d');
    // axios.post(`http://localhost:5000/image?id=${params.id}`, { img: canvasRef.current.toDataURL() }) 
    axios.get(`http://localhost:5000/image?id=${params.id}`) // если есть сохраненный рисунок
      .then(response => {
        const img = new Image()
        img.src = response.data
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      })
      .catch(error => {
        console.log(error.message)
      })
  }, [])

  React.useEffect(() => {
    if (canvasState.username) {
      const socket = new WebSocket(`ws://localhost:5000/`);
      canvasState.setSocket(socket);
      canvasState.setSessionId(params.id);
      toolState.setTool(new Brush(canvasRef.current, socket, params.id));
      socket.onopen = () => {
        console.log('Подключение установлено')
        socket.send(JSON.stringify({
          id: params.id,
          username: canvasState.username,
          method: "connection",
        }))
      }
      socket.onmessage = (event) => {
        let msg = JSON.parse(event.data)
        switch (msg.method) {
          case "connection":
            console.log(`Пользователь ${msg.username} присоеднился`)
            break;
          case "draw":
            drawHandler(msg);
            break;
          default:
            console.log('');
        }
      }
    }
  }, [canvasState.username]);

  const drawHandler = (msg) => {
    const figure = msg.figure;
    const ctx = canvasRef.current.getContext('2d');
    switch (figure.type) {
      case "brush":
        Brush.draw(ctx, figure.x, figure.y)
        break;
      case "rect":
        Rect.staticDraw(ctx, figure.x, figure.y, figure.width, figure.height, figure.color, figure.strokeColor, figure.lineWidth)
        break;
      case "circle":
        Circle.staticDraw(ctx, figure.x, figure.y, figure.width, figure.height, figure.color, figure.strokeColor, figure.lineWidth)
        break;
      case "eraser":
        Eraser.draw(ctx, figure.x, figure.y)
        break;
      case "line":
        Line.draw(ctx, figure.x, figure.y)
        break;
      case "finish":
        ctx.beginPath();
        break;
      default:
        console.log("");
    }
  }

  const mouseDownHandler = () => {
    canvasState.pushToUndo(canvasRef.current.toDataURL());
    axios.post(`http://localhost:5000/image?id=${params.id}`, { img: canvasRef.current.toDataURL() })
  }

  const connectHandler = () => {
    canvasState.setUsername(usernameRef.current.value);
    setModal(false);
  }

  return (
    <div className="canvas">

      <Modal show={modal} onHide={() => { }}>
        <Modal.Header closeButton>
          <Modal.Title>Введите Ваше имя</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input type="text" ref={usernameRef} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => connectHandler()}>
            Войти
          </Button>
        </Modal.Footer>
      </Modal>

      <canvas onMouseDown={() => mouseDownHandler()} ref={canvasRef} width={600} height={400}></canvas>
    </div>
  )
})