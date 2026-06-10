import React from 'react';
import { useParams } from 'react-router-dom';

export default function MovieDetails(){
  const { id } = useParams();
  return (
    <div className="container">
      <h2>Movie {id}</h2>
      <p>Details from API.</p>
    </div>
  )
}
