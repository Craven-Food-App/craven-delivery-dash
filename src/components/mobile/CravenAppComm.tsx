import React, { useState, useRef, useEffect } from 'react';

import { Phone, Clock, Navigation, Home, User, Check, CheckCheck } from 'lucide-react';



const CravenAppComm = () => {

  const [messages, setMessages] = useState([

    {

      id: 1,

      sender: 'customer',

      text: 'Hi! Can you please grab extra napkins?',

      timestamp: new Date(Date.now() - 300000),

      delivered: true,

      read: true

    },

    {

      id: 2,

      sender: 'driver',

      text: 'Sure thing! I\'ll make sure to get extra napkins for you.',

      timestamp: new Date(Date.now() - 240000),

      delivered: true,

      read: true

    },

    {

      id: 3,

      sender: 'customer',

      text: 'Thank you so much!',

      timestamp: new Date(Date.now() - 180000),

      delivered: true,

      read: true

    }

  ]);

  

  const [inputText, setInputText] = useState('');

  const [orderStatus] = useState('picked_up');

  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const inputRef = useRef(null);



  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  };



  useEffect(() => {

    scrollToBottom();

  }, [messages]);



  // Simulate typing indicator

  useEffect(() => {

    if (messages.length > 0) {

      const lastMessage = messages[messages.length - 1];

      if (lastMessage.sender === 'driver') {

        setIsTyping(true);

        const timer = setTimeout(() => setIsTyping(false), 2000);

        return () => clearTimeout(timer);

      }

    }

  }, [messages]);



  const quickReplies = [

    { text: "On my way!", icon: <Navigation size={16} /> },

    { text: "Arriving in 5 minutes", icon: <Clock size={16} /> },

    { text: "At the door", icon: <Home size={16} /> }

  ];



  const orderDetails = {

    orderId: '#7834',

    restaurant: 'Chipotle Mexican Grill',

    customer: 'Sarah M.',

    customerPhone: '+1-555-123-4567',

    address: '742 Evergreen Terrace',

    eta: '12 mins',

    items: 3

  };



  const handleCallCustomer = () => {

    window.location.href = `tel:${orderDetails.customerPhone}`;

  };



  const handleSendMessage = () => {

    if (inputText.trim()) {

      const newMessage = {

        id: messages.length + 1,

        sender: 'driver',

        text: inputText,

        timestamp: new Date(),

        delivered: false,

        read: false

      };

      setMessages([...messages, newMessage]);

      setInputText('');

      setShowQuickReplies(false);

      inputRef.current?.focus();

      

      // Simulate delivery after 1 second

      setTimeout(() => {

        setMessages(prev => prev.map(msg => 

          msg.id === newMessage.id ? { ...msg, delivered: true } : msg

        ));

      }, 1000);

      

      // Simulate read after 3 seconds

      setTimeout(() => {

        setMessages(prev => prev.map(msg => 

          msg.id === newMessage.id ? { ...msg, read: true } : msg

        ));

      }, 3000);

    }

  };



  const handleQuickReply = (text) => {

    const newMessage = {

      id: messages.length + 1,

      sender: 'driver',

      text: text,

      timestamp: new Date(),

      delivered: false,

      read: false

    };

    setMessages([...messages, newMessage]);

    setShowQuickReplies(false);

    

    // Simulate delivery after 1 second

    setTimeout(() => {

      setMessages(prev => prev.map(msg => 

        msg.id === newMessage.id ? { ...msg, delivered: true } : msg

      ));

    }, 1000);

    

    // Simulate read after 3 seconds

    setTimeout(() => {

      setMessages(prev => prev.map(msg => 

        msg.id === newMessage.id ? { ...msg, read: true } : msg

      ));

    }, 3000);

  };



  const formatTime = (date) => {

    return date.toLocaleTimeString('en-US', { 

      hour: 'numeric', 

      minute: '2-digit',

      hour12: true 

    });

  };



  return (

    <div style={{ 

      display: 'flex', 

      flexDirection: 'column', 

      height: '100vh', 

      background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',

      maxWidth: '448px',

      margin: '0 auto',

      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

      position: 'relative'

    }}>

      {/* Glassmorphic Header */}

      <div style={{

        background: 'linear-gradient(135deg, #fa5252 0%, #e03131 100%)',

        color: 'white',

        padding: '20px 16px',

        boxShadow: '0 8px 32px rgba(224, 49, 49, 0.3)',

        backdropFilter: 'blur(10px)',

        position: 'relative',

        overflow: 'hidden'

      }}>

        {/* Decorative background pattern */}

        <div style={{

          position: 'absolute',

          top: 0,

          left: 0,

          right: 0,

          bottom: 0,

          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',

          pointerEvents: 'none'

        }}></div>

        

        <div style={{ 

          display: 'flex', 

          alignItems: 'center', 

          justifyContent: 'space-between',

          marginBottom: '16px',

          position: 'relative',

          zIndex: 1

        }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <div>

              <span style={{ fontWeight: 700, fontSize: '18px', display: 'block' }}>

                {orderDetails.customer}

              </span>

              <span style={{ fontSize: '12px', opacity: 0.9 }}>Customer</span>

            </div>

          </div>

          <button 

            onClick={handleCallCustomer}

            style={{

              background: 'transparent',

              border: 'none',

              padding: '8px',

              cursor: 'pointer',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              transition: 'all 0.3s ease',

              color: 'white'

            }}

            onMouseEnter={(e) => {

              e.target.style.transform = 'scale(1.1)';

            }}

            onMouseLeave={(e) => {

              e.target.style.transform = 'scale(1)';

            }}

          >

            <Phone size={22} />

          </button>

        </div>

        

        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 1 }}>

          <div style={{ 

            display: 'flex', 

            alignItems: 'center', 

            gap: '8px',

            background: 'rgba(255,255,255,0.15)',

            padding: '8px 12px',

            borderRadius: '20px',

            backdropFilter: 'blur(10px)',

            border: '1px solid rgba(255,255,255,0.2)',

            width: 'fit-content'

          }}>

            <div style={{

              width: '8px',

              height: '8px',

              backgroundColor: '#51cf66',

              borderRadius: '50%',

              animation: 'pulse 2s infinite',

              boxShadow: '0 0 8px rgba(81, 207, 102, 0.8)'

            }}></div>

            <span style={{ fontWeight: 600, fontSize: '12px' }}>

              {orderStatus === 'picked_up' ? 'Order Picked Up - Delivering' : 'Waiting at Restaurant'}

            </span>

          </div>

          <div style={{ 

            display: 'flex', 

            alignItems: 'center', 

            gap: '8px',

            paddingLeft: '4px'

          }}>

            <Clock size={14} />

            <span style={{ fontWeight: 500 }}>ETA: {orderDetails.eta}</span>

          </div>

        </div>

      </div>



      {/* Messages Container with improved styling */}

      <div style={{

        flex: 1,

        overflowY: 'auto',

        padding: '20px 16px',

        display: 'flex',

        flexDirection: 'column',

        gap: '16px',

        background: 'transparent'

      }}>

        {messages.map((message, index) => (

          <div

            key={message.id}

            style={{

              display: 'flex',

              justifyContent: message.sender === 'driver' ? 'flex-end' : 'flex-start',

              animation: 'slideIn 0.3s ease-out',

              animationDelay: `${index * 0.05}s`,

              animationFillMode: 'both'

            }}

          >

            <div style={{

              maxWidth: '80%',

              borderRadius: '18px',

              padding: '12px 16px',

              background: message.sender === 'driver' 

                ? 'linear-gradient(135deg, #fa5252 0%, #e03131 100%)' 

                : 'white',

              color: message.sender === 'driver' ? 'white' : '#212529',

              borderBottomRightRadius: message.sender === 'driver' ? '4px' : '18px',

              borderBottomLeftRadius: message.sender === 'driver' ? '18px' : '4px',

              boxShadow: message.sender === 'customer' 

                ? '0 2px 12px rgba(0,0,0,0.08)' 

                : '0 4px 16px rgba(224, 49, 49, 0.3)',

              position: 'relative'

            }}>

              <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5', fontWeight: 400 }}>

                {message.text}

              </p>

              <div style={{

                margin: '6px 0 0 0',

                fontSize: '11px',

                opacity: 0.75,

                fontWeight: 500,

                display: 'flex',

                alignItems: 'center',

                gap: '4px',

                justifyContent: message.sender === 'driver' ? 'flex-end' : 'flex-start'

              }}>

                <span>{formatTime(message.timestamp)}</span>

                {message.sender === 'driver' && (

                  <span style={{ display: 'flex', alignItems: 'center' }}>

                    {message.read ? (

                      <CheckCheck size={14} style={{ color: '#51cf66' }} />

                    ) : message.delivered ? (

                      <CheckCheck size={14} />

                    ) : (

                      <Check size={14} />

                    )}

                  </span>

                )}

              </div>

            </div>

          </div>

        ))}



        {/* Typing Indicator */}

        {isTyping && (

          <div style={{

            display: 'flex',

            justifyContent: 'flex-start',

            animation: 'slideIn 0.3s ease-out'

          }}>

            <div style={{

              backgroundColor: 'white',

              borderRadius: '18px',

              padding: '12px 16px',

              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',

              display: 'flex',

              gap: '4px',

              alignItems: 'center'

            }}>

              <div style={{

                width: '8px',

                height: '8px',

                borderRadius: '50%',

                backgroundColor: '#adb5bd',

                animation: 'typingDot 1.4s infinite'

              }}></div>

              <div style={{

                width: '8px',

                height: '8px',

                borderRadius: '50%',

                backgroundColor: '#adb5bd',

                animation: 'typingDot 1.4s infinite 0.2s'

              }}></div>

              <div style={{

                width: '8px',

                height: '8px',

                borderRadius: '50%',

                backgroundColor: '#adb5bd',

                animation: 'typingDot 1.4s infinite 0.4s'

              }}></div>

            </div>

          </div>

        )}

        

        <div ref={messagesEndRef} />

      </div>



      {/* Enhanced Quick Replies */}

      {showQuickReplies && (

        <div style={{

          padding: '0 16px 12px 16px',

          background: 'transparent'

        }}>

          <div style={{

            display: 'flex',

            flexDirection: 'column',

            gap: '10px'

          }}>

            {quickReplies.map((reply, index) => (

              <button

                key={index}

                onClick={() => handleQuickReply(reply.text)}

                style={{

                  background: 'linear-gradient(135deg, #fd8c3c 0%, #fd7e14 100%)',

                  border: 'none',

                  color: 'white',

                  fontSize: '14px',

                  padding: '14px 18px',

                  borderRadius: '12px',

                  cursor: 'pointer',

                  transition: 'all 0.3s ease',

                  fontWeight: 600,

                  textAlign: 'left',

                  boxShadow: '0 4px 16px rgba(253, 126, 20, 0.35)',

                  display: 'flex',

                  alignItems: 'center',

                  gap: '10px',

                  position: 'relative',

                  overflow: 'hidden'

                }}

                onMouseEnter={(e) => {

                  e.target.style.transform = 'translateY(-2px)';

                  e.target.style.boxShadow = '0 6px 20px rgba(253, 126, 20, 0.45)';

                }}

                onMouseLeave={(e) => {

                  e.target.style.transform = 'translateY(0)';

                  e.target.style.boxShadow = '0 4px 16px rgba(253, 126, 20, 0.35)';

                }}

              >

                {reply.icon}

                <span>{reply.text}</span>

              </button>

            ))}

          </div>

        </div>

      )}



      {/* Modern Message Input */}

      <div style={{

        background: 'white',

        padding: '16px',

        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',

        borderTop: '1px solid rgba(0,0,0,0.06)'

      }}>

        <div style={{ 

          display: 'flex', 

          alignItems: 'center', 

          gap: '10px',

          background: '#f8f9fa',

          borderRadius: '24px',

          padding: '4px 4px 4px 18px',

          border: '2px solid transparent',

          transition: 'all 0.3s ease'

        }}

        onFocus={(e) => {

          e.currentTarget.style.borderColor = '#fd7e14';

          e.currentTarget.style.background = 'white';

        }}

        onBlur={(e) => {

          e.currentTarget.style.borderColor = 'transparent';

          e.currentTarget.style.background = '#f8f9fa';

        }}

        >

          <input

            ref={inputRef}

            type="text"

            value={inputText}

            onChange={(e) => setInputText(e.target.value)}

            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}

            placeholder="Type a message..."

            style={{

              flex: 1,

              background: 'transparent',

              border: 'none',

              fontSize: '15px',

              outline: 'none',

              color: '#212529'

            }}

          />

          <button

            onClick={handleSendMessage}

            disabled={!inputText.trim()}

            style={{

              padding: '12px',

              borderRadius: '50%',

              border: 'none',

              background: inputText.trim() 

                ? 'linear-gradient(135deg, #fa5252 0%, #e03131 100%)' 

                : '#e9ecef',

              color: inputText.trim() ? 'white' : '#adb5bd',

              cursor: inputText.trim() ? 'pointer' : 'not-allowed',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              transition: 'all 0.3s ease',

              boxShadow: inputText.trim() ? '0 4px 12px rgba(224, 49, 49, 0.3)' : 'none',

              transform: 'rotate(0deg)'

            }}

            onMouseEnter={(e) => {

              if (inputText.trim()) {

                e.target.style.transform = 'rotate(-15deg) scale(1.05)';

              }

            }}

            onMouseLeave={(e) => {

              e.target.style.transform = 'rotate(0deg) scale(1)';

            }}

          >

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">

              <line x1="22" y1="2" x2="11" y2="13"></line>

              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>

            </svg>

          </button>

        </div>

      </div>



      <style>{`

        @keyframes pulse {

          0%, 100% { opacity: 1; transform: scale(1); }

          50% { opacity: 0.7; transform: scale(0.95); }

        }

        

        @keyframes slideIn {

          from {

            opacity: 0;

            transform: translateY(10px);

          }

          to {

            opacity: 1;

            transform: translateY(0);

          }

        }

        

        @keyframes typingDot {

          0%, 60%, 100% { transform: translateY(0); }

          30% { transform: translateY(-8px); }

        }

      `}</style>

    </div>

  );

};



export default CravenAppComm;

