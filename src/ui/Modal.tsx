import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
// Native modal dialogs provide focus containment, inert background and focus return.
export function Modal({titleId,onClose,children,className=''}:{titleId:string;onClose:()=>void;children:ReactNode;className?:string}){
  const opener=useRef(document.activeElement instanceof HTMLElement?document.activeElement:null);
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current!;dialog.showModal();return()=>{dialog.close();if(opener.current?.isConnected)opener.current.focus({preventScroll:true});};},[]);
  return <dialog ref={ref} className={`planner ${className}`} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();onClose();}}>{children}</dialog>;
}
