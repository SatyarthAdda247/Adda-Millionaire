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
    question: "Who can join the Millionaire's Adda program?",
    answer:
      "Anyone with an engaged audience on social media can join. Whether you're on Instagram, YouTube, Telegram, WhatsApp, or any other platform, if you create content that helps students or learners, you're a great fit for our program.",
  },
  {
    question: "Is it free to join?",
    answer:
      "Yes, absolutely! Joining the Millionaire's Adda program is completely free. There are no signup fees, hidden charges, or minimum requirements to get started.",
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
];

const FAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 md:py-32 bg-background" ref={ref}>
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to know before getting started.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-muted/30 rounded-2xl border-none px-6 data-[state=open]:bg-muted/50 transition-colors duration-300"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:no-underline py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
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
