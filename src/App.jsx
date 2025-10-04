// src/App.jsx
import { useEffect, useState } from 'react';
import { Booker } from '@calcom/atoms';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Create a client outside the component to prevent recreation on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function BookerComponent() {
  const [username, setUsername] = useState('');
  const [eventSlug, setEventSlug] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to get URL parameters
    const getUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      return {
        username: params.get('username') || '',
        eventSlug: params.get('eventSlug') || ''
      };
    };

    // Get parameters from URL
    const params = getUrlParams();
    setUsername(params.username);
    setEventSlug(params.eventSlug);
    setIsLoading(false);

    // Listen for messages from parent iframe (Bubble.io)
    const handleMessage = (event) => {
      // For security, you might want to check event.origin
      // if (event.origin !== "https://your-bubble-app.com") return;
      
      if (event.data && event.data.type === 'UPDATE_BOOKER') {
        if (event.data.username) setUsername(event.data.username);
        if (event.data.eventSlug) setEventSlug(event.data.eventSlug);
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Show loading or error state if params are missing
  if (isLoading) {
    return (
      <div className="container">
        <div className="message">Loading...</div>
      </div>
    );
  }

  if (!username || !eventSlug) {
    return (
      <div className="container">
        <div className="message">
          <h2>Missing Parameters</h2>
          <p>Please provide both username and eventSlug parameters.</p>
          <p>Example: ?username=john&eventSlug=30min</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Booker
        username={username}
        eventSlug={eventSlug}
        onCreateBookingSuccess={(data) => {
          console.log('Booking created successfully:', data);
          // Send message back to parent (Bubble.io)
          window.parent.postMessage({
            type: 'BOOKING_SUCCESS',
            data: data
          }, '*');
        }}
        onCreateBookingError={(error) => {
          console.error('Booking creation failed:', error);
          // Send error message back to parent (Bubble.io)
          window.parent.postMessage({
            type: 'BOOKING_ERROR',
            error: error
          }, '*');
        }}
        customClassNames={{
          bookerContainer: "custom-booker-container"
        }}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BookerComponent />
    </QueryClientProvider>
  );
}

export default App;