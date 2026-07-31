import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SEO } from '../../components/SEO';
import { Reveal } from '../../components/Reveal';
import { Button } from '../../components/Button';
import { useCreateInquiry } from '../../hooks/useInquiries';
import { useSiteSettings } from '../../hooks/useSettings';
import { toast } from '../../lib/toast';

const schema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Tell us a bit more about your project'),
});

export default function ContactPage() {
  const { data: settings } = useSiteSettings();
  const createInquiry = useCreateInquiry();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await createInquiry.mutateAsync(values);
      toast.success('Message sent — we will get back to you shortly.');
      reset();
    } catch {
      toast.error('Could not send your message. Please try again or call us.');
    }
  };

  const wa = settings?.whatsappNumber;
  const waLink = wa ? `https://wa.me/${wa.replace(/\D/g, '')}` : null;

  return (
    <>
      <SEO
        title="Contact"
        description="Get a quote from RamArts for printing, signage, or branding."
        path="/contact"
      />

      <section className="container-page section-pad">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="label-field">Contact</p>
              <h1 className="mt-3 font-display text-display-xl">Let&apos;s talk about your project.</h1>
              <p className="mt-4 text-ink-muted">
                Share a brief outline — materials, quantity, timeline — and we&apos;ll respond with next steps.
              </p>
            </Reveal>

            <Reveal delay={0.1} className="mt-10 space-y-6">
              {settings?.contactEmail && (
                <div>
                  <p className="label-field">Email</p>
                  <a className="text-lg hover:text-brand" href={`mailto:${settings.contactEmail}`}>
                    {settings.contactEmail}
                  </a>
                </div>
              )}
              {settings?.contactPhone && (
                <div>
                  <p className="label-field">Phone</p>
                  <a className="text-lg hover:text-brand" href={`tel:${settings.contactPhone}`}>
                    {settings.contactPhone}
                  </a>
                </div>
              )}
              {waLink && (
                <div>
                  <p className="label-field">WhatsApp</p>
                  <a className="text-lg hover:text-brand" href={waLink} target="_blank" rel="noreferrer">
                    Chat with us
                  </a>
                </div>
              )}
              {settings?.address && (
                <div>
                  <p className="label-field">Studio</p>
                  <p className="whitespace-pre-line text-ink-muted">{settings.address}</p>
                </div>
              )}
              {settings?.businessHours && (
                <div>
                  <p className="label-field">Hours</p>
                  <p className="text-ink-muted">{settings.businessHours}</p>
                </div>
              )}
            </Reveal>

            {settings?.mapEmbedUrl && (
              <Reveal delay={0.15} className="mt-10 aspect-video overflow-hidden bg-paper-sunken">
                <iframe
                  title="Studio location map"
                  src={settings.mapEmbedUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </Reveal>
            )}
          </div>

          <Reveal delay={0.1} className="lg:col-span-7">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 border border-line bg-paper-raised p-6 sm:p-8"
              noValidate
            >
              <div>
                <label htmlFor="name" className="label-field">
                  Name
                </label>
                <input id="name" className="input-field" autoComplete="name" {...register('name')} />
                {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="label-field">
                    Email
                  </label>
                  <input id="email" type="email" className="input-field" autoComplete="email" {...register('email')} />
                  {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="label-field">
                    Phone <span className="normal-case tracking-normal">(optional)</span>
                  </label>
                  <input id="phone" type="tel" className="input-field" autoComplete="tel" {...register('phone')} />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="label-field">
                  Project details
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="input-field resize-y"
                  placeholder="What do you need printed or fabricated? Quantities, sizes, deadline…"
                  {...register('message')}
                />
                {errors.message && <p className="mt-1 text-sm text-danger">{errors.message.message}</p>}
              </div>
              <Button type="submit" loading={createInquiry.isPending}>
                Send message
              </Button>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
}
