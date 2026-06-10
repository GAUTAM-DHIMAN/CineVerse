import React from 'react';

export default function Login(){
  return (
    <div className="container">
      <h2>Login</h2>
      <form>
        <div><input placeholder="email"/></div>
        <div><input type="password" placeholder="password"/></div>
        <button>Login</button>
      </form>
    </div>
  )
}
