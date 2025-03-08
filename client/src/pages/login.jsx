
import React, { useContext, useState } from "react";
import { SparklesCore } from "../components/ui/sparkles";
import axios from "axios";

import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  async function handleLogin(e){
    e.preventDefault();
    // const res = await axios.post("http://localhost:4000/auth/login", {
    //     email , password
    // })
    // if(res.data){
    //   login(res.data);
    //   navigate('/home');
    // }
    if(localStorage.getItem('signup')){
        navigate('/dashboard');
    }
    //navigate('/dashboard');
  }
  return (
    <div className="flex min-h-screen bg-black text-white relative overflow-hidden">
      {/* Sparkles Background */}
      <div className="absolute inset-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      
      {/* Login Form Centered */}
      <div className="relative z-10 flex justify-center items-center w-full p-10">
        <div className="w-full max-w-md bg-black/50 backdrop-blur-sm text-white p-6 rounded-lg shadow-lg border border-white/20">
          <h2 className="text-2xl font-bold text-center mb-4">Login</h2>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium my-1">Email</label>
              <input
                type="email"
                className="w-full p-2 bg-black/50 border border-white/20 rounded-md focus:ring focus:ring-white/30 text-white placeholder-white/50"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium my-1">Password</label>
              <input
                type="password"
                className="w-full p-2 bg-black/50 border border-white/20 rounded-md focus:ring focus:ring-white/30 text-white placeholder-white/50"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-black p-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              Login →
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-4">
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-400 hover:text-blue-300">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
