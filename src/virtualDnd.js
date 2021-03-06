import eventUtil from './eventUtil';
import { closestChild, parse } from './util/common';
import { exclude } from './util/variables'

let elementConfig = [{
    displayname: 'default',
    selector: ['body, body *'],
    draggable: 'true',
    droppable: 'true',
    hoverable: 'true',
    selectable: 'true',
    editable: 'true',
    // toolbar: { 'test': 'testing this' },
  },
  {
    displayname: 'body',
    selector: ['body, body'],
    draggable: 'false',
  },
  {
    displayname: 'form',
    selector: ['form'],
    editable: 'true'
  },
  {
    displayname: 'input',
    selector: 'input',
    editable: 'false'
  },
  {
    displayname: 'textarea',
    selector: 'textarea',
    editable: 'false'
  },
  {
    displayname: 'select',
    selector: 'select',
    editable: 'false'
  },
];


function UUID(length = 10) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  var d = new Date().toTimeString();
  var random = d.replace(/[\W_]+/g, "").substr(0, 6);
  result += random;
  return result;
}

let topleft = ['left', 'top'];

export default function virtualDnd() {
  this.dragedEl;
  this.dropedEl;
  this.position;
  this.id;
  this.type;

  let evnt = new eventUtil();


  this.on = function() {
    evnt.on.apply(evnt, arguments);
  }

  this.dragStart = (e, el, id, ref, dropType) => {
    // #broadcast
    // domEditor({
    //   obj: selectorUtil.cssPath( this.dropedEl),
    //   method: 'insertAdjacentElement',
    //   value: { param1: [this.position, selectorUtil.cssPath(this.dragedEl)] }
    // });
    this.id = id;
    this.dropType = dropType;
    console.log({
      comment: 'dragStart',
    })
    // dfonclk.onActive(e.target)
    // selectBoxMarker.hide(onRemove)
    // greenDropMarker.hide();
    el.setAttribute('CoC-dragging', true)
    this.dragedEl = el;
    evnt.dispatch('dragStart', { e, el, ref })
  }

  this.dragEnd = (e, ref) => {
    try {
      if (this.position) {
        if (this.dropedEl === this.dragedEl)
          throw 'dnd cancelled. you can dnd on the same element.'

        // in future we should also disable hover and tag name in dragOver method
        // parent can't be draged into children
        if (this.dragedEl.contains(this.dropedEl))
          throw 'dnd cancelled, you can\'t dnd from parent to its children.'
        dom.element('default', {
          target: this.dragedEl,
          idGenerator: () => UUID(12),

        });

        // #broadcast
        let broadcast = {
          target: this.dropedEl,
          method: 'insertAdjacentElement',
          value: [this.position, this.dragedEl]
        };





        // domEditor(broadcast)
        broadcast.target = broadcast.target.getAttribute('data-element_id');
        if (this.dropType !== 'data-CoC-cloneable')
          broadcast.value[1] = broadcast.value[1].getAttribute('data-element_id');
        else {
          let clonedEl = parse('<div>' + broadcast.value[1].outerHTML + '</div>');
          dom.element(
            elementConfig, { context: clonedEl }
          )
          broadcast.value[1] = clonedEl.innerHTML;
        }

        console.log('dnd Object', broadcast)

        console.log('sending object from ', window.location.pathname)

        if (this.dropType === 'data-CoC-cloneable') {
          dom.element('default', {
            target: broadcast.draggedEl,
            draggable: 'true',
            droppable: 'true',
            hoverable: 'true',
            selectable: 'true',
            editable: 'true',
          });


          CoCreate.sendMessage({
            broadcast_sender: true,
            rooms: '',
            emit: {
              message: 'dndNewElement',
              data: broadcast
            }
          })
          CoCreate.sendMessage({
            broadcast_sender: true,
            rooms: '',
            emit: {
              message: 'vdomNewElement',
              data: broadcast
            }
          })

          

        }
        else
          CoCreate.sendMessage({
            broadcast_sender: true,
            rooms: '',
            emit: {
              message: 'domEditor',
              data: broadcast
            }
          })

        this.id = null;

        // dispatch gloval events
        const event = new CustomEvent('dndsuccess', {
          bubbles: true,
          detail: {
            position: this.position,
            dragedEl: this.dragedEl,
            dropedEl: this.dropedEl
          }
        });
        this.dropedEl.dispatchEvent(event, { bubbles: true })

      }
    }
    catch (e) {
      console.error(e)
    }
    finally {
      this.position = null;
      if (this.dragedEl)
        this.dragedEl.removeAttribute('CoC-dragging')
      // greenDropMarker.hide()
      // dfonclk.onInactive(e.target)
      console.log('dnd completed', 'type:', this.type, 'position:', this.position)
      evnt.dispatch('dragEnd', { e, ref })
    }
  }


  this.dragOver =
    (e, el, ref) => {
      // el is the element hovered
      if (el.children.length === 0) {
        // place top or bottom inside the element
        let [orientation, closestEl] = closestChild([e.x, e.y], [el]);
        evnt.dispatch('dragOver', { e, el, closestEl, orientation, hasChild: el.children.length, ref })
        // greenDropMarker.draw(el, el, orientation, true);
        // hoverBoxMarker.draw(el)
        // tagNameTooltip.draw(el)
        this.position = topleft.includes(orientation) ? "afterbegin" : "beforeend";
        this.dropedEl = el;
        this.type = "normal"


      }
      else {
        // find closest child and put outside the child element on top or bottom relating to that child,
        let [orientation, closestEl] = closestChild([e.x, e.y], el.children);

        // greenDropMarker.draw(el, closestEl, orientation, false);
        // hoverBoxMarker.draw(el)
        // tagNameTooltip.draw(el)
        if (closestEl.getAttribute('data-coc-exclude') == 'true') {
          this.dropedEl = closestEl.parentElement;
          // only to get orientation
          let [orientation2, closestEl2] = closestChild([e.x, e.y], [this.dropedEl]);
          orientation = orientation2;
        }
        else
          this.dropedEl = closestEl;

        evnt.dispatch('dragOver', { e, el, closestEl, orientation, hasChild: el.children.length, ref })

        this.position = topleft.includes(orientation) ? "beforebegin" : "afterend";


        this.type = "children"

      }
    }
}
