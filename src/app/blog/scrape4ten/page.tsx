import { NextPage } from 'next';

const Scrape4TenPage: NextPage = () => {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="bg-white text-center py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold text-gray-900">100% Money-Back Guarantee</h1>
          <h2 className="text-6xl font-extrabold text-orange-600 my-4">$10 Web Scraping</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Pay, request, and get results. If we fail, you get a full refund. If we succeed, you get your data. It's that simple.</p>
          <div className="mt-8 space-x-4">
            <a href="#request-form" className="bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors">Request Scraping Service</a>
            <a href="#pricing" className="bg-gray-200 text-gray-800 font-semibold px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors">View Pricing</a>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose-us" className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900">Why Choose Us?</h2>
          <p className="text-lg text-gray-600 mt-4">Simple, transparent, and reliable web scraping service</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900">100% Money-Back Guarantee</h3>
              <p className="mt-4 text-gray-600">If we fail to deliver your scraping results, you get a full refund. No questions asked.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900">Fast & Reliable</h3>
              <p className="mt-4 text-gray-600">We deliver your scraped data quickly and accurately. Pay once, get results.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900">Code Available</h3>
              <p className="mt-4 text-gray-600">Want the scraping code too? Add $5 and get the complete codebase for your project.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900">No Hidden Costs</h3>
              <p className="mt-4 text-gray-600">Just $10 per request. Optional +$5 for code. That's it. Transparent pricing, always.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
          <p className="text-lg text-gray-600 mt-4">Three simple steps to get your data</p>
          <div className="grid md:grid-cols-3 gap-12 mt-12 text-left">
            <div className="relative">
              <div className="text-8xl font-extrabold text-gray-100">01</div>
              <div className="relative -mt-12 ml-4">
                <h3 className="text-2xl font-semibold text-gray-900">Submit Your Request</h3>
                <p className="mt-4 text-gray-600">Tell us what website you need scraped and what data you want extracted. Include any specific requirements.</p>
              </div>
            </div>
            <div className="relative">
              <div className="text-8xl font-extrabold text-gray-100">02</div>
              <div className="relative -mt-12 ml-4">
                <h3 className="text-2xl font-semibold text-gray-900">We Get to Work</h3>
                <p className="mt-4 text-gray-600">Our team processes your request and builds a custom scraping solution for your specific needs.</p>
              </div>
            </div>
            <div className="relative">
              <div className="text-8xl font-extrabold text-gray-100">03</div>
              <div className="relative -mt-12 ml-4">
                <h3 className="text-2xl font-semibold text-gray-900">Receive Your Data</h3>
                <p className="mt-4 text-gray-600">Get your scraped data delivered. If you ordered the code, you'll receive that too. 100% satisfaction guaranteed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600 mt-4">No subscriptions. No complicated tiers. Just pay for what you need.</p>
          <div className="grid md:grid-cols-2 gap-8 mt-12 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-900">Base Service</h3>
              <p className="text-5xl font-bold text-gray-900 mt-4">$10</p>
              <p className="text-gray-600">per request</p>
              <ul className="mt-8 space-y-4 text-gray-600">
                <li>Web scraping service</li>
                <li>Accurate data extraction</li>
                <li>Fast delivery</li>
                <li>100% money-back guarantee</li>
                <li>Full refund if we fail</li>
              </ul>
              <a href="#request-form" className="mt-8 inline-block bg-gray-800 text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-900 transition-colors">Get Started</a>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-orange-600 relative">
              <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-sm font-semibold px-4 py-1 rounded-full">Popular</div>
              <h3 className="text-2xl font-semibold text-gray-900">With Code</h3>
              <p className="text-5xl font-bold text-gray-900 mt-4">$15</p>
              <p className="text-gray-600">per request</p>
              <p className="text-sm text-gray-500">Base + $5 for code</p>
              <ul className="mt-8 space-y-4 text-gray-600">
                <li>Everything in Base Service</li>
                <li>Complete scraping codebase</li>
                <li>Ready to use & modify</li>
                <li>Well-documented code</li>
                <li>Reusable for future projects</li>
              </ul>
              <a href="#request-form" className="mt-8 inline-block bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors">Get Started with Code</a>
            </div>
          </div>
        </div>
      </section>

      {/* Request Form Section */}
      <section id="request-form" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900">Request Scraping Service</h2>
            <p className="text-lg text-gray-600 mt-4">Fill out the form below and we'll get started on your project</p>
          </div>
          <form className="mt-12 max-w-xl mx-auto">
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
              <input type="text" id="name" name="name" placeholder="John Doe" className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" id="email" name="email" placeholder="john@example.com" className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div className="mb-6">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">Website URL to Scrape</label>
              <input type="url" id="url" name="url" placeholder="https://example.com" className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500" />
            </div>
            <div className="mb-6">
              <label htmlFor="details" className="block text-sm font-medium text-gray-700">Project Details</label>
              <textarea id="details" name="details" rows={4} placeholder="Describe what data you need extracted, any specific requirements, formatting preferences, etc." className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"></textarea>
            </div>
            <div className="mb-6">
              <div className="flex items-center">
                <input id="include-code" name="include-code" type="checkbox" className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                <label htmlFor="include-code" className="ml-2 block text-sm text-gray-900">Include codebase (+$5) - Get the complete scraping code for your project</label>
              </div>
            </div>
            <div className="text-center mb-6">
              <p className="text-2xl font-bold text-gray-900">Total Price: <span className="text-orange-600">$10</span></p>
            </div>
            <div className="text-center">
              <button type="submit" className="bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors w-full">Submit Request</button>
              <p className="text-sm text-gray-500 mt-4">100% money-back guarantee if we can't deliver your results</p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Scrape4TenPage;
