import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeletons';
import { useSiteSettings, useUpdateSettings } from '../../hooks/useSettings';
import { toast } from '../../lib/toast';

const schema = z.object({
  heroTitle: z.string().min(1),
  heroSubtitle: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  whatsappNumber: z.string().optional(),
  address: z.string().optional(),
  mapEmbedUrl: z.string().optional(),
  businessHours: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
});

export default function AdminSettingsPage() {
  const { data: settings, isLoading } = useSiteSettings();
  const save = useUpdateSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (settings) {
      reset({
        heroTitle: settings.heroTitle || '',
        heroSubtitle: settings.heroSubtitle || '',
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        whatsappNumber: settings.whatsappNumber || '',
        address: settings.address || '',
        mapEmbedUrl: settings.mapEmbedUrl || '',
        businessHours: settings.businessHours || '',
        instagram: settings.socialLinks?.instagram || '',
        facebook: settings.socialLinks?.facebook || '',
      });
    }
  }, [settings, reset]);

  const onSubmit = async (values) => {
    try {
      await save.mutateAsync({
        heroTitle: values.heroTitle,
        heroSubtitle: values.heroSubtitle,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        whatsappNumber: values.whatsappNumber,
        address: values.address,
        mapEmbedUrl: values.mapEmbedUrl,
        businessHours: values.businessHours,
        socialLinks: {
          instagram: values.instagram || '',
          facebook: values.facebook || '',
        },
      });
      toast.success('Settings saved — live on the site immediately');
    } catch {
      toast.error('Could not save settings');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Site Settings" path="/admin/settings" />
      <h1 className="font-display text-display-md">Site settings</h1>
      <p className="text-ink-muted">Hero copy, contact info, and social links — no redeploy needed.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-2xl space-y-5">
        <fieldset className="space-y-4 border border-line bg-paper-raised p-5">
          <legend className="px-1 font-display text-lg font-600">Hero</legend>
          <div>
            <label className="label-field" htmlFor="heroTitle">
              Title
            </label>
            <input id="heroTitle" className="input-field" {...register('heroTitle')} />
            {errors.heroTitle && <p className="mt-1 text-sm text-danger">{errors.heroTitle.message}</p>}
          </div>
          <div>
            <label className="label-field" htmlFor="heroSubtitle">
              Subtitle
            </label>
            <textarea id="heroSubtitle" rows={3} className="input-field" {...register('heroSubtitle')} />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border border-line bg-paper-raised p-5">
          <legend className="px-1 font-display text-lg font-600">Contact</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="contactEmail">
                Email
              </label>
              <input id="contactEmail" className="input-field" {...register('contactEmail')} />
            </div>
            <div>
              <label className="label-field" htmlFor="contactPhone">
                Phone
              </label>
              <input id="contactPhone" className="input-field" {...register('contactPhone')} />
            </div>
          </div>
          <div>
            <label className="label-field" htmlFor="whatsappNumber">
              WhatsApp number
            </label>
            <input
              id="whatsappNumber"
              className="input-field"
              placeholder="919876543210"
              {...register('whatsappNumber')}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="address">
              Address
            </label>
            <textarea id="address" rows={3} className="input-field" {...register('address')} />
          </div>
          <div>
            <label className="label-field" htmlFor="businessHours">
              Business hours
            </label>
            <input id="businessHours" className="input-field" {...register('businessHours')} />
          </div>
          <div>
            <label className="label-field" htmlFor="mapEmbedUrl">
              Google Maps embed URL
            </label>
            <input id="mapEmbedUrl" className="input-field" placeholder="https://www.google.com/maps/embed?..." {...register('mapEmbedUrl')} />
          </div>
        </fieldset>

        <fieldset className="space-y-4 border border-line bg-paper-raised p-5">
          <legend className="px-1 font-display text-lg font-600">Social</legend>
          <div>
            <label className="label-field" htmlFor="instagram">
              Instagram URL
            </label>
            <input id="instagram" className="input-field" {...register('instagram')} />
          </div>
          <div>
            <label className="label-field" htmlFor="facebook">
              Facebook URL
            </label>
            <input id="facebook" className="input-field" {...register('facebook')} />
          </div>
        </fieldset>

        <Button type="submit" loading={save.isPending} disabled={!isDirty && !save.isPending}>
          Save settings
        </Button>
      </form>
    </>
  );
}
