import { Star } from "lucide-react";
import { UploadForm } from "~/app/_components/UploadForm";

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* Badge */}
      <section className="flex justify-center pt-20 bg-[#fdfbf7]">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 text-secondary-foreground font-bold text-sm border border-secondary/50 shadow-sm backdrop-blur-sm">
          <Star className="w-4 h-4 fill-secondary-foreground" />
          <span>Trusted by 10,000+ Happy Parents</span>
        </div>
      </section>

      {/* Headline */}
      <section className="flex flex-col items-center text-center px-6 pt-8 pb-8 bg-[#fdfbf7]">
        <h1 className="text-3xl md:text-4xl font-bold leading-[1.1] mb-4 tracking-tight text-foreground drop-shadow-sm">
          Turn Family Trips into{" "}
          <br />
          <span className="text-primary relative inline-block">
            Magical Storybooks
            <svg
              className="absolute w-full h-3 -bottom-1 left-0 text-secondary"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              style={{ zIndex: -1 }}
            >
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </h1>
        <p className="text-md text-muted-foreground max-w-2xl leading-relaxed">
          Upload your photos, and our AI will weave a personalized tale with
          beautiful illustrations starring your family.
        </p>
      </section>

      {/* Upload */}
      <section className="flex justify-center px-6 pb-20 bg-[#fdfbf7]">
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5">
          <UploadForm />
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container px-6 mx-auto py-20">
        <div className="flex flex-col md:flex-row gap-6">
          {[
            {
              icon: <Star className="w-6 h-6 text-yellow-500" />,
              title: "AI-Powered Magic",
              desc: "Narratives tailored to your specific locations and activities.",
            },
            {
              icon: <span className="text-xl">❤️</span>,
              title: "Keepsake Quality",
              desc: "Premium hardcover books that last a lifetime.",
            },
            {
              icon: <span className="text-xl">🛡️</span>,
              title: "Private & Secure",
              desc: "Your photos are yours. We prioritize your family's privacy.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-8 rounded-xl bg-card border border-border/50 hover:shadow-lg transition-shadow flex-1"
            >
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-md font-bold mb-2">{feature.title}</h3>
              <p className="text-base text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
