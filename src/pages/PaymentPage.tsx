
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/layout/PageTransition';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Interface for service data
interface ServiceData {
  id: string;
  title: string;
  price: number;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ServiceData[]>([]);
  const [serviceDate, setServiceDate] = useState<Date | undefined>(undefined);
  const [serviceTime, setServiceTime] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    agreeTerms: false
  });
  
  // Payment flow states
  const [paymentStep, setPaymentStep] = useState<'form' | 'qr' | 'success'>('form');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Available time slots
  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM'
  ];

  // Load selected services from session storage
  useEffect(() => {
    try {
      const savedServices = sessionStorage.getItem('selectedServices');
      if (savedServices) {
        setSelectedServices(JSON.parse(savedServices));
      } else {
        // Redirect if no services selected
        navigate('/services');
      }
    } catch (error) {
      console.error('Error loading selected services:', error);
      navigate('/services');
    }
  }, [navigate]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Calculate total
  const calculateTotal = (): number => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, agreeTerms: checked }));
  };

  // Initialize Razorpay payment
  const initializePayment = () => {
    if (!serviceDate || !serviceTime) {
      toast({
        title: "Date and Time Required",
        description: "Please select a date and time for the service.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.agreeTerms) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the terms and conditions to proceed.",
        variant: "destructive",
      });
      return;
    }

    // Basic form validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Create payment intent data
    const paymentData = {
      key: "rzp_test_YOUR_KEY_ID", // Replace with your actual key in production
      amount: calculateTotal() * 100, // Amount in paise
      currency: "INR",
      name: "Swargvatika",
      description: "Payment for cremation services",
      image: "/path/to/your/logo.png",
      handler: function(response: any) {
        // Handle successful payment
        toast({
          title: "Payment Successful",
          description: `Payment ID: ${response.razorpay_payment_id}`,
        });
        
        // In a real app, you would verify the payment on your server
        // For demo purposes, we'll simulate success and redirect
        setTimeout(() => {
          navigate('/');
        }, 2000);
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      notes: {
        address: formData.address,
        services: selectedServices.map(s => s.title).join(', '),
      },
      theme: {
        color: "#51BC2B",
      },
    };

    console.log("Razorpay payment would initialize with options:", paymentData);
    
    // Move to QR code view
    setPaymentStep('qr');
    
    // After 30 seconds, show success animation
    timerRef.current = setTimeout(() => {
      setPaymentStep('success');
      
      // After success animation, redirect to home
      setTimeout(() => {
        toast({
          title: "E-Receipt Sent",
          description: "Your e-receipt has been sent to your email address.",
        });
        navigate('/');
      }, 3000);
    }, 30000);
  };

  // Generate e-receipt
  const generateReceipt = () => {
    const receiptData = {
      receiptNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
      date: format(new Date(), 'dd/MM/yyyy'),
      customerName: formData.name,
      email: formData.email,
      phone: formData.phone,
      services: selectedServices,
      serviceDate: serviceDate ? format(serviceDate, 'dd/MM/yyyy') : '',
      serviceTime: serviceTime,
      subtotal: calculateTotal(),
      gst: calculateTotal() * 0.18,
      total: calculateTotal() * 1.18
    };
    
    console.log('Receipt generated:', receiptData);
    
    // In a real app, this would generate and send an actual receipt
    toast({
      title: "E-Receipt Generated",
      description: "Your e-receipt has been generated and will be sent to your email."
    });
    
    return receiptData;
  };

  return (
    <PageTransition>
      {/* Page Header */}
      <PageHeader
        title="Complete Your Booking"
        description="Review your selected services and proceed with payment."
      />

      {/* Main Content */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            {paymentStep === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form Section */}
                <div className="lg:col-span-2">
                  <ScrollReveal>
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-md">
                      <h2 className="font-serif text-2xl font-bold mb-6">Contact Information</h2>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input 
                              id="name" 
                              name="name" 
                              placeholder="Enter your full name" 
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input 
                              id="email" 
                              name="email" 
                              type="email" 
                              placeholder="Enter your email address" 
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input 
                              id="phone" 
                              name="phone" 
                              placeholder="Enter your phone number" 
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input 
                              id="address" 
                              name="address" 
                              placeholder="Enter your address" 
                              value={formData.address}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Service Date *</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !serviceDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {serviceDate ? format(serviceDate, "PPP") : <span>Select date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={serviceDate}
                                  onSelect={setServiceDate}
                                  initialFocus
                                  disabled={(date) => date < new Date()}
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Service Time *</Label>
                            <Select value={serviceTime} onValueChange={setServiceTime}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select time">
                                  {serviceTime ? (
                                    <div className="flex items-center">
                                      <Clock className="mr-2 h-4 w-4" />
                                      <span>{serviceTime}</span>
                                    </div>
                                  ) : (
                                    "Select time"
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    <div className="flex items-center">
                                      <span>{time}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="notes">Additional Notes</Label>
                          <Textarea 
                            id="notes" 
                            name="notes" 
                            placeholder="Any special requirements or information we should know" 
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={4}
                          />
                        </div>
                        
                        <div className="flex items-start space-x-2 pt-4">
                          <Checkbox 
                            id="terms" 
                            checked={formData.agreeTerms}
                            onCheckedChange={handleCheckboxChange}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor="terms"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              I agree to the terms and conditions
                            </label>
                            <p className="text-sm text-muted-foreground">
                              By proceeding, you confirm that you have read and agree to our{" "}
                              <a href="#" className="text-primary hover:underline">
                                Terms & Conditions
                              </a>{" "}
                              and{" "}
                              <a href="#" className="text-primary hover:underline">
                                Privacy Policy
                              </a>
                              .
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <ScrollReveal direction="left">
                    <div className={cn(
                      "bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md sticky top-24"
                    )}>
                      <h2 className="font-serif text-2xl font-bold mb-6">Order Summary</h2>
                      
                      {selectedServices.length > 0 ? (
                        <div className="space-y-4">
                          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            {selectedServices.map((service, index) => (
                              <motion.div 
                                key={service.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex justify-between items-center py-2"
                              >
                                <span>{service.title}</span>
                                <span>₹{service.price.toLocaleString()}</span>
                              </motion.div>
                            ))}
                          </div>
                          
                          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>₹{calculateTotal().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-muted-foreground">GST (18%)</span>
                              <span>₹{(calculateTotal() * 0.18).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center py-2 font-bold">
                            <span>Total</span>
                            <span className="text-xl">₹{(calculateTotal() * 1.18).toLocaleString()}</span>
                          </div>
                          
                          <Button 
                            onClick={initializePayment}
                            className="w-full bg-primary hover:bg-primary/90 text-white mt-4 shimmer-button"
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </div>
                            ) : (
                              "Proceed to Payment"
                            )}
                          </Button>
                          
                          <div className="text-center mt-3">
                            <p className="text-xs text-muted-foreground">Secure payment powered by Razorpay</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No services selected</p>
                          <Button 
                            onClick={() => navigate('/services')}
                            variant="outline" 
                            className="mt-4"
                          >
                            Return to Services
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                </div>
              </motion.div>
            )}

            {paymentStep === 'qr' && (
              <motion.div
                key="qr"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-md mx-auto text-center bg-white dark:bg-gray-900 rounded-xl p-8 shadow-md"
              >
                <h2 className="font-serif text-2xl font-bold mb-4">Scan to Pay</h2>
                <p className="text-muted-foreground mb-6">
                  Please scan the QR code below to complete your payment of ₹{(calculateTotal() * 1.18).toLocaleString()}
                </p>
                
                <div className="border-4 border-primary rounded-lg p-2 mb-6 inline-block bg-white">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" 
                    alt="Payment QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Payment will be auto-verified within 30 seconds
                </p>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                  <motion.div 
                    className="bg-primary h-2.5 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 30, ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}

            {paymentStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-md mx-auto text-center bg-white dark:bg-gray-900 rounded-xl p-8 shadow-md"
              >
                <div className="payment-success mb-6">
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                  </svg>
                </div>
                
                <h2 className="font-serif text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-muted-foreground mb-6">Your booking has been confirmed.</p>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-medium mb-2">Booking Details:</h3>
                  <p className="text-sm mb-1">
                    <span className="text-muted-foreground">Date:</span> {serviceDate ? format(serviceDate, "PPP") : ''}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="text-muted-foreground">Time:</span> {serviceTime}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="text-muted-foreground">Services:</span> {selectedServices.map(s => s.title).join(', ')}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Total Amount:</span> ₹{(calculateTotal() * 1.18).toLocaleString()}
                  </p>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  An e-receipt has been sent to your email address: {formData.email}
                </p>
                
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full bg-primary hover:bg-primary/90 text-white shimmer-button"
                >
                  Return to Home
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </PageTransition>
  );
}
