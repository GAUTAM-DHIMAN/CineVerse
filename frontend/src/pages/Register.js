import React from 'react';

export default function Register(){
  return (
    <div className="container">
      <h2>Register</h2>
      <form>
        <div><input placeholder="username"/></div>
        <div><input placeholder="email"/></div>
        <div><input type="password" placeholder="password"/></div>
        <button>Register</button>
      </form>
    </div>
  )
}
