import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Who can join the EduRise program?",
    answer:
      "Anyone with an engaged audience on social media can join. Whether you're on Instagram, YouTube, Telegram, WhatsApp, or any other platform, if you create content that helps students or learners, you're a great fit for our program.",
  },
  {
    question: "Is it free to join?",
    answer:
      "Yes, absolutely! Joining the EduRise program is completely free. There are no signup fees, hidden charges, or minimum requirements to get started.",
  },
  {
    question: "How do payouts work?",
    answer:
      "Payouts are processed monthly. Once you accumulate earnings above the minimum threshold, the amount is transferred directly to your bank account. You can track all your earnings in real-time through your dashboard.",
  },
  {
    question: "Is there a minimum follower requirement?",
    answer:
      "We don't have a strict minimum requirement. What matters more is the quality of your engagement and the relevance of your audience. Even affiliates with smaller, highly engaged communities can earn well with the right approach.",
  },
  {
    question: "How is my performance tracked?",
    answer:
      "All clicks, conversions, and earnings are tracked through a secure system powered by Trackier. You'll have access to a real-time dashboard showing exactly how your content is performing.",
  },
  {
    question: "How much do I earn on renewals?",
    answer:
      "When a user you referred renews their subscription, you earn 20% commission, which is ₹40 per renewal. This recurring income continues every month as long as they stay subscribed, creating a passive income stream.",
  },
];

const FAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 bg-background" ref={ref}>
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8">
            Frequently Asked <span className="text-green-600">Questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white rounded-2xl border border-gray-200 px-8 data-[state=open]:bg-blue-50 transition-colors duration-300 shadow-sm"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-lg md:text-xl text-gray-900 hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base md:text-lg text-gray-600 pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
