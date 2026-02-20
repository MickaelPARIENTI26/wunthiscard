'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COMPETITION_CATEGORIES } from '@winucard/shared';
import { createCompetition, updateCompetition } from '@/app/dashboard/competitions/actions';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { Loader2, Star } from 'lucide-react';
import { setFeaturedCompetition } from '@/app/dashboard/competitions/actions';
import type { Competition } from '@winucard/database';

// Zod validation schema for competition form
const competitionFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  subtitle: z.string().max(300, 'Subtitle must be less than 300 characters').optional(),
  descriptionShort: z.string().min(1, 'Short description is required').max(500, 'Short description must be less than 500 characters'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().max(100).optional(),
  prizeValue: z.coerce.number().positive('Prize value must be positive'),
  ticketPrice: z.coerce.number().min(1, 'Ticket price must be at least £1'),
  totalTickets: z.coerce.number().int().min(1, 'Must have at least 1 ticket').max(100000, 'Maximum 100,000 tickets'),
  maxTicketsPerUser: z.coerce.number().int().min(1, 'Minimum 1 ticket per user').max(100, 'Maximum 100 tickets per user').optional(),
  saleStartDate: z.string().optional(),
  drawDate: z.string().min(1, 'Draw date is required'),
  mainImageUrl: z.string().url('Please enter a valid URL'),
  galleryUrls: z.string().optional(),
  videoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  certificationNumber: z.string().max(50).optional(),
  grade: z.string().max(20).optional(),
  condition: z.string().max(100).optional(),
  provenance: z.string().optional(),
  questionText: z.string().min(1, 'Skill question is required'),
  questionAnswer: z.string().min(1, 'Please select the correct answer'),
  metaTitle: z.string().max(70, 'Meta title must be less than 70 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
});

type CompetitionFormData = z.infer<typeof competitionFormSchema>;

// Serialized competition type with number instead of Decimal
type SerializedCompetition = Omit<Competition, 'prizeValue' | 'ticketPrice'> & {
  prizeValue: number;
  ticketPrice: number;
};

interface CompetitionFormProps {
  competition?: SerializedCompetition;
}

export function CompetitionForm({ competition }: CompetitionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);
  const [isFeatured, setIsFeatured] = useState(competition?.isFeatured ?? false);
  const [descriptionLong, setDescriptionLong] = useState(competition?.descriptionLong ?? '');
  const [questionChoices, setQuestionChoices] = useState<string[]>(
    (competition?.questionChoices as string[]) ?? ['', '', '', '']
  );

  const isEditing = !!competition;
  const isActive = competition?.status === 'ACTIVE';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionFormSchema),
    defaultValues: {
      title: competition?.title ?? '',
      subtitle: competition?.subtitle ?? '',
      descriptionShort: competition?.descriptionShort ?? '',
      category: competition?.category ?? 'POKEMON',
      subcategory: competition?.subcategory ?? '',
      prizeValue: competition?.prizeValue ?? undefined,
      ticketPrice: competition?.ticketPrice ?? undefined,
      totalTickets: competition?.totalTickets ?? undefined,
      maxTicketsPerUser: competition?.maxTicketsPerUser ?? 50,
      saleStartDate: competition?.saleStartDate
        ? new Date(competition.saleStartDate).toISOString().slice(0, 16)
        : '',
      drawDate: competition?.drawDate
        ? new Date(competition.drawDate).toISOString().slice(0, 16)
        : '',
      mainImageUrl: competition?.mainImageUrl ?? '',
      galleryUrls: competition?.galleryUrls?.join(', ') ?? '',
      videoUrl: competition?.videoUrl ?? '',
      certificationNumber: competition?.certificationNumber ?? '',
      grade: competition?.grade ?? '',
      condition: competition?.condition ?? '',
      provenance: competition?.provenance ?? '',
      questionText: competition?.questionText ?? '',
      questionAnswer: competition?.questionAnswer?.toString() ?? '0',
      metaTitle: competition?.metaTitle ?? '',
      metaDescription: competition?.metaDescription ?? '',
    },
  });

  const selectedCategory = watch('category');

  async function handleToggleFeatured(checked: boolean) {
    if (!competition) return;

    setIsTogglingFeatured(true);
    try {
      await setFeaturedCompetition(checked ? competition.id : null);
      setIsFeatured(checked);
    } catch (error) {
      console.error('Failed to update featured status:', error);
      setIsFeatured(!checked);
    } finally {
      setIsTogglingFeatured(false);
    }
  }

  async function onSubmit(data: CompetitionFormData) {
    // Validate question choices
    const validChoices = questionChoices.filter(c => c && c.trim().length > 0);
    if (validChoices.length !== 4) {
      setServerError('Please fill in all 4 answer choices');
      return;
    }

    // Validate description long
    if (!descriptionLong || descriptionLong.trim().length === 0) {
      setServerError('Long description is required');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, String(value));
      }
    });
    formData.set('descriptionLong', descriptionLong);
    formData.set('questionChoices', JSON.stringify(questionChoices));

    try {
      if (isEditing) {
        await updateCompetition(competition.id, formData);
      } else {
        await createCompetition(formData);
      }
    } catch (error) {
      console.error('Failed to save competition:', error);
      setServerError(error instanceof Error ? error.message : 'Failed to save competition');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverError && (
        <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {serverError}
        </div>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="qcm">Skill Question</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          {/* Featured Competition Toggle - only for editing active competitions */}
          {isEditing && (
            <Card className={`mb-6 ${isFeatured ? 'border-amber-500 bg-amber-500/5' : ''}`}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isFeatured ? 'bg-amber-500 text-black' : 'bg-muted'}`}>
                    <Star className="h-5 w-5" fill={isFeatured ? 'currentColor' : 'none'} />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Featured on Homepage</Label>
                    <p className="text-sm text-muted-foreground">
                      {isFeatured
                        ? 'This competition is displayed in the homepage hero section'
                        : isActive
                        ? 'Display this competition in the homepage hero section'
                        : 'Only ACTIVE competitions can be featured'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isFeatured}
                  onCheckedChange={handleToggleFeatured}
                  disabled={!isActive || isTogglingFeatured}
                  aria-label="Toggle featured status"
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Charizard PSA 10 Base Set"
                    {...register('title')}
                    aria-invalid={!!errors.title}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    placeholder="The Holy Grail of Pokémon Cards"
                    {...register('subtitle')}
                    aria-invalid={!!errors.subtitle}
                  />
                  {errors.subtitle && (
                    <p className="text-sm text-destructive">{errors.subtitle.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger aria-invalid={!!errors.category}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COMPETITION_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    placeholder="Base Set, Sports Memorabilia, etc."
                    {...register('subcategory')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionShort">Short Description *</Label>
                <Textarea
                  id="descriptionShort"
                  placeholder="A brief description for cards and listings..."
                  rows={3}
                  {...register('descriptionShort')}
                  aria-invalid={!!errors.descriptionShort}
                />
                {errors.descriptionShort && (
                  <p className="text-sm text-destructive">{errors.descriptionShort.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Long Description *</Label>
                <RichTextEditor
                  content={descriptionLong}
                  onChange={setDescriptionLong}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="prizeValue">Prize Value (£) *</Label>
                  <Input
                    id="prizeValue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1000.00"
                    {...register('prizeValue')}
                    aria-invalid={!!errors.prizeValue}
                  />
                  {errors.prizeValue && (
                    <p className="text-sm text-destructive">{errors.prizeValue.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Ticket Price (£) *</Label>
                  <Input
                    id="ticketPrice"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="2.99"
                    {...register('ticketPrice')}
                    aria-invalid={!!errors.ticketPrice}
                  />
                  {errors.ticketPrice && (
                    <p className="text-sm text-destructive">{errors.ticketPrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalTickets">Total Tickets *</Label>
                  <Input
                    id="totalTickets"
                    type="number"
                    min="1"
                    max="100000"
                    placeholder="1000"
                    {...register('totalTickets')}
                    aria-invalid={!!errors.totalTickets}
                  />
                  {errors.totalTickets && (
                    <p className="text-sm text-destructive">{errors.totalTickets.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="maxTicketsPerUser">Max Tickets Per User</Label>
                  <Input
                    id="maxTicketsPerUser"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="50"
                    {...register('maxTicketsPerUser')}
                    aria-invalid={!!errors.maxTicketsPerUser}
                  />
                  {errors.maxTicketsPerUser && (
                    <p className="text-sm text-destructive">{errors.maxTicketsPerUser.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleStartDate">Sale Start Date</Label>
                  <Input
                    id="saleStartDate"
                    type="datetime-local"
                    {...register('saleStartDate')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drawDate">Draw Date *</Label>
                  <Input
                    id="drawDate"
                    type="datetime-local"
                    {...register('drawDate')}
                    aria-invalid={!!errors.drawDate}
                  />
                  {errors.drawDate && (
                    <p className="text-sm text-destructive">{errors.drawDate.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainImageUrl">Main Image URL *</Label>
                <Input
                  id="mainImageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...register('mainImageUrl')}
                  aria-invalid={!!errors.mainImageUrl}
                />
                {errors.mainImageUrl && (
                  <p className="text-sm text-destructive">{errors.mainImageUrl.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter the URL of the main competition image
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="galleryUrls">Gallery Images</Label>
                <Textarea
                  id="galleryUrls"
                  placeholder="Enter image URLs separated by commas..."
                  rows={3}
                  {...register('galleryUrls')}
                />
                <p className="text-xs text-muted-foreground">
                  Enter image URLs separated by commas (max 10 images)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  {...register('videoUrl')}
                  aria-invalid={!!errors.videoUrl}
                />
                {errors.videoUrl && (
                  <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Grading</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certificationNumber">Certification Number</Label>
                  <Input
                    id="certificationNumber"
                    placeholder="PSA # or BGS #"
                    {...register('certificationNumber')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    placeholder="PSA 10, BGS 9.5, etc."
                    {...register('grade')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Input
                  id="condition"
                  placeholder="Gem Mint, Near Mint, etc."
                  {...register('condition')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provenance">Provenance</Label>
                <Textarea
                  id="provenance"
                  placeholder="History or origin of the item..."
                  rows={3}
                  {...register('provenance')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qcm">
          <Card>
            <CardHeader>
              <CardTitle>Skill Question (QCM)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Required for UK compliance. The question should be challenging enough to deter
                a significant portion of participants.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="questionText">Question *</Label>
                <Textarea
                  id="questionText"
                  placeholder="In what year was the first Pokémon TCG base set released in Japan?"
                  rows={2}
                  {...register('questionText')}
                  aria-invalid={!!errors.questionText}
                />
                {errors.questionText && (
                  <p className="text-sm text-destructive">{errors.questionText.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label>Answer Choices *</Label>
                {questionChoices.map((choice, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-6 font-medium">{String.fromCharCode(65 + index)}.</span>
                    <Input
                      value={choice}
                      onChange={(e) => {
                        const newChoices = [...questionChoices];
                        newChoices[index] = e.target.value;
                        setQuestionChoices(newChoices);
                      }}
                      placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
                {questionChoices.filter(c => c.trim()).length < 4 && (
                  <p className="text-sm text-muted-foreground">
                    All 4 answer choices are required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionAnswer">Correct Answer *</Label>
                <Select
                  value={watch('questionAnswer')}
                  onValueChange={(value) => setValue('questionAnswer', value)}
                >
                  <SelectTrigger aria-invalid={!!errors.questionAnswer}>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">A. {questionChoices[0] ?? 'Choice A'}</SelectItem>
                    <SelectItem value="1">B. {questionChoices[1] ?? 'Choice B'}</SelectItem>
                    <SelectItem value="2">C. {questionChoices[2] ?? 'Choice C'}</SelectItem>
                    <SelectItem value="3">D. {questionChoices[3] ?? 'Choice D'}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.questionAnswer && (
                  <p className="text-sm text-destructive">{errors.questionAnswer.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO title (defaults to competition title)"
                  maxLength={70}
                  {...register('metaTitle')}
                  aria-invalid={!!errors.metaTitle}
                />
                {errors.metaTitle && (
                  <p className="text-sm text-destructive">{errors.metaTitle.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max 70 characters. Leave empty to use competition title.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="SEO description (defaults to short description)"
                  maxLength={160}
                  rows={3}
                  {...register('metaDescription')}
                  aria-invalid={!!errors.metaDescription}
                />
                {errors.metaDescription && (
                  <p className="text-sm text-destructive">{errors.metaDescription.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max 160 characters. Leave empty to use short description.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/competitions')}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Update Competition'
          ) : (
            'Create Competition'
          )}
        </Button>
      </div>
    </form>
  );
}
