'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);
  const [isFeatured, setIsFeatured] = useState(competition?.isFeatured ?? false);
  const [descriptionLong, setDescriptionLong] = useState(competition?.descriptionLong ?? '');
  const [questionChoices, setQuestionChoices] = useState<string[]>(
    (competition?.questionChoices as string[]) ?? ['', '', '', '']
  );

  const isEditing = !!competition;
  const isActive = competition?.status === 'ACTIVE';

  async function handleToggleFeatured(checked: boolean) {
    if (!competition) return;

    setIsTogglingFeatured(true);
    try {
      await setFeaturedCompetition(checked ? competition.id : null);
      setIsFeatured(checked);
    } catch (error) {
      console.error('Failed to update featured status:', error);
      // Revert on error
      setIsFeatured(!checked);
    } finally {
      setIsTogglingFeatured(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit}>
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
                    name="title"
                    placeholder="Charizard PSA 10 Base Set"
                    defaultValue={competition?.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    name="subtitle"
                    placeholder="The Holy Grail of Pokémon Cards"
                    defaultValue={competition?.subtitle ?? ''}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" defaultValue={competition?.category ?? 'POKEMON'}>
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    name="subcategory"
                    placeholder="Base Set, Sports Memorabilia, etc."
                    defaultValue={competition?.subcategory ?? ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descriptionShort">Short Description *</Label>
                <Textarea
                  id="descriptionShort"
                  name="descriptionShort"
                  placeholder="A brief description for cards and listings..."
                  defaultValue={competition?.descriptionShort}
                  required
                  rows={3}
                />
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
                    name="prizeValue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1000.00"
                    defaultValue={competition?.prizeValue?.toString()}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketPrice">Ticket Price (£) *</Label>
                  <Input
                    id="ticketPrice"
                    name="ticketPrice"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="2.99"
                    defaultValue={competition?.ticketPrice?.toString()}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalTickets">Total Tickets *</Label>
                  <Input
                    id="totalTickets"
                    name="totalTickets"
                    type="number"
                    min="1"
                    max="100000"
                    placeholder="1000"
                    defaultValue={competition?.totalTickets?.toString()}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="maxTicketsPerUser">Max Tickets Per User</Label>
                  <Input
                    id="maxTicketsPerUser"
                    name="maxTicketsPerUser"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="50"
                    defaultValue={competition?.maxTicketsPerUser?.toString() ?? '50'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleStartDate">Sale Start Date</Label>
                  <Input
                    id="saleStartDate"
                    name="saleStartDate"
                    type="datetime-local"
                    defaultValue={
                      competition?.saleStartDate
                        ? new Date(competition.saleStartDate).toISOString().slice(0, 16)
                        : ''
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drawDate">Draw Date *</Label>
                  <Input
                    id="drawDate"
                    name="drawDate"
                    type="datetime-local"
                    defaultValue={
                      competition?.drawDate
                        ? new Date(competition.drawDate).toISOString().slice(0, 16)
                        : ''
                    }
                    required
                  />
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
                  name="mainImageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  defaultValue={competition?.mainImageUrl}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL of the main competition image
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="galleryUrls">Gallery Images</Label>
                <Textarea
                  id="galleryUrls"
                  name="galleryUrls"
                  placeholder="Enter image URLs separated by commas..."
                  defaultValue={competition?.galleryUrls?.join(', ')}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Enter image URLs separated by commas (max 10 images)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  name="videoUrl"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  defaultValue={competition?.videoUrl ?? ''}
                />
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
                    name="certificationNumber"
                    placeholder="PSA # or BGS #"
                    defaultValue={competition?.certificationNumber ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    name="grade"
                    placeholder="PSA 10, BGS 9.5, etc."
                    defaultValue={competition?.grade ?? ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Input
                  id="condition"
                  name="condition"
                  placeholder="Gem Mint, Near Mint, etc."
                  defaultValue={competition?.condition ?? ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provenance">Provenance</Label>
                <Textarea
                  id="provenance"
                  name="provenance"
                  placeholder="History or origin of the item..."
                  defaultValue={competition?.provenance ?? ''}
                  rows={3}
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
                  name="questionText"
                  placeholder="In what year was the first Pokémon TCG base set released in Japan?"
                  defaultValue={competition?.questionText}
                  required
                  rows={2}
                />
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
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionAnswer">Correct Answer *</Label>
                <Select
                  name="questionAnswer"
                  defaultValue={competition?.questionAnswer?.toString() ?? '0'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">A. {questionChoices[0] || 'Choice A'}</SelectItem>
                    <SelectItem value="1">B. {questionChoices[1] || 'Choice B'}</SelectItem>
                    <SelectItem value="2">C. {questionChoices[2] || 'Choice C'}</SelectItem>
                    <SelectItem value="3">D. {questionChoices[3] || 'Choice D'}</SelectItem>
                  </SelectContent>
                </Select>
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
                  name="metaTitle"
                  placeholder="SEO title (defaults to competition title)"
                  defaultValue={competition?.metaTitle ?? ''}
                  maxLength={70}
                />
                <p className="text-xs text-muted-foreground">
                  Max 70 characters. Leave empty to use competition title.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  placeholder="SEO description (defaults to short description)"
                  defaultValue={competition?.metaDescription ?? ''}
                  maxLength={160}
                  rows={3}
                />
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
