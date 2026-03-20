import { Star } from "lucide-react";
import { UploadForm } from "~/app/_components/UploadForm";

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#fdfbf7]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#fdfbf7] z-0" />

        <div className="container relative z-10 px-4 flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 text-secondary-foreground font-bold text-sm border border-secondary/50 shadow-sm backdrop-blur-sm">
            <Star className="w-4 h-4 fill-secondary-foreground" />
            <span>Trusted by 10,000+ Happy Parents</span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 tracking-tight text-foreground drop-shadow-sm">
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
                  <path
                    d="M0 5 Q 50 10 100 5"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload your photos, and our AI will weave a personalized tale with
              beautiful illustrations starring your family.
            </p>
          </div>

          {/* Upload card */}
          <div className="w-full mt-4">
            <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-black/5">
              <UploadForm />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container px-4 mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Star className="w-6 h-6 text-yellow-500" />,
              title: "AI-Powered Magic",
              desc: "Narratives tailored to your specific locations and activities.",
            },
            {
              icon: <span className="text-3xl">❤️</span>,
              title: "Keepsake Quality",
              desc: "Premium hardcover books that last a lifetime.",
            },
            {
              icon: <span className="text-3xl">🛡️</span>,
              title: "Private & Secure",
              desc: "Your photos are yours. We prioritize your family's privacy.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/50 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
