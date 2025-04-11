This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

## Additional Info

# Directory Structure
```
myapp_bless/
  admin.py
  apps.py
  constants.py
  forms.py
  models.py
  tests.py
  urls.py
  views.py
mysite_project/
  asgi.py
  settings.py
  urls.py
  wsgi.py
static/
  css/
    night.css
    pop.css
templates/
  app/
    base.html
    baseatk.html
    bootstrap.html
    gs.html
    home.html
    rune_dreaming.html
    shapedoctor.html
    skill_pro.html
    timers.html
.gitignore
manage.py
README.md
```

# Files

## File: myapp_bless/admin.py
```python
from django.contrib import admin

# Register your models here.
```

## File: myapp_bless/apps.py
```python
from django.apps import AppConfig


class MyappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'myapp_bless'
```

## File: myapp_bless/constants.py
```python
GEAR_RANK_CHOICE = (("0", "-"), ("1", "A Gear"), ("2", "S/S+ Gear"))
FORT_RANK_CHOICE = (("0", "-"), ("1", "Legendary"), ("2", "Mystic"))
FORT_LEVEL_CHOICE = (("0", "-"), ("1", "+0"), ("2", "+1"), ("3", "+2"), ("4", "+3"), ("5", "+4"), ("6", "+5"))

RUNE_COLORS_CHOICE = (("0", "-"), ("1", "Rainbow"), ("2", "Red"), ("3", "White"), ("4", "Yellow"), ("5", "Green"), ("6", "Purple"))

ELIXIR_CHOICE = (("0", "-"), ("1", "Thorns III"), ("2", "Hunter III"), ("3", "Destruction III"))
PANACEA_CHOICE = (("0", "-"), ("1", "Blade"), ("2", "Superior Blade"), ("3", "Destruction"), ("4", "Superior Destruction"), ("5", "Hunter"), ("6", "Superior Sharpness"))
FOOD_CHOICE = (("0", "-"), ("1", "Beef Curry"), ("2", "Tiger Shrimp"))

W_GEAR_SCORES = [0, 217, 221, 229, 234, 240, 246, 257, 263, 268, 274, 280, 286,
                 246, 251, 257, 263, 268, 274, 286, 291, 297, 303, 308, 314]

OH_GEAR_SCORES = [0, 46, 47, 48, 49, 51, 52, 54, 55, 57, 58, 59, 60,
                  52, 53, 54, 55, 57, 58, 60, 61, 62, 63, 64, 65]

HEAD_GEAR_SCORES = [0, 123, 129, 132, 136, 139, 142, 149, 152, 155, 158, 162, 165,
                    142, 146, 149, 152, 155, 158, 165, 169, 172, 175, 178, 182]

CHEST_GEAR_SCORES = [0, 171, 176, 180, 185, 189, 194, 203, 207, 212, 216, 221, 225,
                     194, 198, 203, 207, 212, 216, 225, 230, 234, 239, 243, 248]

PANTS_GEAR_SCORES = [0, 171, 176, 180, 185, 189, 194, 203, 207, 212, 216, 221, 225,
                     194, 198, 203, 207, 212, 216, 225, 230, 234, 239, 243, 248]

BOOTS_GEAR_SCORES = [0, 114, 117, 120, 123, 126, 129, 135, 138, 141, 144, 147, 150,
                     129, 132, 135, 138, 141, 144, 150, 153, 156, 159, 162, 165]

GLOVES_GEAR_SCORES = [0, 91, 94, 96, 99, 101, 103, 108, 111, 113, 115, 118, 120,
                      103, 106, 108, 111, 113, 115, 120, 123, 125, 127, 130, 132]

SHOULDER_GEAR_SCORES = [0, 91, 94, 96, 99, 101, 103, 108, 111, 113, 115, 118, 120,
                      103, 106, 108, 111, 113, 115, 120, 123, 125, 127, 130, 132]

BELT_GEAR_SCORES = [0, 114, 117, 120, 123, 126, 129, 135, 138, 141, 144, 147, 150,
                     129, 132, 135, 138, 141, 144, 150, 153, 156, 159, 162, 165]
```

## File: myapp_bless/forms.py
```python
from django import forms
from django.contrib.admin.widgets import AdminSplitDateTime
from django.forms import BaseFormSet, formset_factory

from bootstrap5.widgets import RadioSelectButtonGroup

from myapp_bless.constants import FORT_RANK_CHOICE, FORT_LEVEL_CHOICE, GEAR_RANK_CHOICE, RUNE_COLORS_CHOICE, \
    ELIXIR_CHOICE, PANACEA_CHOICE, FOOD_CHOICE


class GearscoreForm(forms.Form):
    w_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    w_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    w_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)
    off_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    off_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    off_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)
    head_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    head_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    head_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)
    chest_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    chest_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    chest_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)
    pants_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    pants_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    pants_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)
    gloves_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    gloves_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    gloves_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)
    boots_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    boots_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    boots_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)
    shoulder_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    shoulder_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    shoulder_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)
    belt_gear_rank = forms.ChoiceField(choices=GEAR_RANK_CHOICE, initial=0)
    belt_fort_rank = forms.ChoiceField(choices=FORT_RANK_CHOICE, initial=0)
    belt_fort_level = forms.ChoiceField(choices=FORT_LEVEL_CHOICE, initial=0)


class GearRunesForm(forms.Form):
    w_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    w_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    w_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    w_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    w_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    off_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    off_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    off_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    off_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    off_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    head_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    head_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    head_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    head_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    head_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    chest_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    chest_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    chest_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    chest_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    chest_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    pants_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    pants_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    pants_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    pants_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    pants_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    gloves_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    gloves_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    gloves_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    gloves_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    gloves_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    boots_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    boots_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    boots_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    boots_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    boots_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    shoulder_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    shoulder_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    shoulder_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    shoulder_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    shoulder_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    belt_rune_1 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    belt_rune_2 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    belt_rune_3 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    belt_rune_4 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)
    belt_rune_5 = forms.ChoiceField(choices=RUNE_COLORS_CHOICE, initial=0)


class BaseATKForm(forms.Form):
    elixir = forms.ChoiceField(choices=ELIXIR_CHOICE, initial=0)
    panacea = forms.ChoiceField(choices=PANACEA_CHOICE, initial=0)
    food = forms.ChoiceField(choices=FOOD_CHOICE, initial=0)
    base_atk = forms.FloatField(initial=0.0)
    atk_bonus = forms.FloatField(initial=0.0)
    crit_rate = forms.FloatField(initial=0.0)
    crit_dmg = forms.FloatField(initial=0.0)
    all_dmg = forms.FloatField(initial=0.0)
    plus_atk_1 = forms.FloatField(initial=0.0)
    plus_atk_pct_1 = forms.FloatField(initial=0.0)
    plus_cr_1 = forms.FloatField(initial=0.0)
    plus_cd_1 = forms.FloatField(initial=0.0)
    plus_all_dmg_1 = forms.FloatField(initial=0.0)
    plus_atk_2 = forms.FloatField(initial=0.0)
    plus_atk_pct_2 = forms.FloatField(initial=0.0)
    plus_cr_2 = forms.FloatField(initial=0.0)
    plus_cd_2 = forms.FloatField(initial=0.0)
    plus_all_dmg_2 = forms.FloatField(initial=0.0)
```

## File: myapp_bless/models.py
```python
from django.db import models

# Create your models here.
```

## File: myapp_bless/tests.py
```python
from django.test import TestCase

# Create your tests here.
```

## File: myapp_bless/urls.py
```python
# myapp_bless/urls.py
from django.urls import path
from .views import HomePageView
urlpatterns = [
    path("", HomePageView.as_view(), name="home"),
]
```

## File: myapp_bless/views.py
```python
from django.http import HttpResponse
from django.views.generic.base import TemplateView
from django.shortcuts import render

# Create your views here.
from myapp_bless.constants import W_GEAR_SCORES, OH_GEAR_SCORES, HEAD_GEAR_SCORES, CHEST_GEAR_SCORES, \
    PANTS_GEAR_SCORES, BOOTS_GEAR_SCORES, GLOVES_GEAR_SCORES, SHOULDER_GEAR_SCORES, BELT_GEAR_SCORES
from myapp_bless.forms import GearscoreForm, GearRunesForm, BaseATKForm


class HomePageView(TemplateView):
    template_name = "app/home.html"

    def get(self, request, *args, **kwargs):
        return render(request, "app/home.html")


class GSPage(TemplateView):
    template_name = "app/gs.html"

    def get(self, request, *args, **kwargs):
        form_class = GearscoreForm()
        return render(request, self.template_name, {'form': form_class})

    def post(self, request):
        form_class = GearscoreForm(request.POST)
        w_gear_score = 0
        if form_class.is_valid():
            w_gear_rank = form_class.cleaned_data['w_gear_rank']
            w_fort_rank = form_class.cleaned_data['w_fort_rank']
            w_fort_level = form_class.cleaned_data['w_fort_level']

            off_gear_rank = form_class.cleaned_data['off_gear_rank']
            off_fort_rank = form_class.cleaned_data['off_fort_rank']
            off_fort_level = form_class.cleaned_data['off_fort_level']

            head_gear_rank = form_class.cleaned_data['head_gear_rank']
            head_fort_rank = form_class.cleaned_data['head_fort_rank']
            head_fort_level = form_class.cleaned_data['head_fort_level']

            chest_gear_rank = form_class.cleaned_data['chest_gear_rank']
            chest_fort_rank = form_class.cleaned_data['chest_fort_rank']
            chest_fort_level = form_class.cleaned_data['chest_fort_level']

            pants_gear_rank = form_class.cleaned_data['pants_gear_rank']
            pants_fort_rank = form_class.cleaned_data['pants_fort_rank']
            pants_fort_level = form_class.cleaned_data['pants_fort_level']

            gloves_gear_rank = form_class.cleaned_data['gloves_gear_rank']
            gloves_fort_rank = form_class.cleaned_data['gloves_fort_rank']
            gloves_fort_level = form_class.cleaned_data['gloves_fort_level']

            boots_gear_rank = form_class.cleaned_data['boots_gear_rank']
            boots_fort_rank = form_class.cleaned_data['boots_fort_rank']
            boots_fort_level = form_class.cleaned_data['boots_fort_level']

            shoulder_gear_rank = form_class.cleaned_data['shoulder_gear_rank']
            shoulder_fort_rank = form_class.cleaned_data['shoulder_fort_rank']
            shoulder_fort_level = form_class.cleaned_data['shoulder_fort_level']

            belt_gear_rank = form_class.cleaned_data['belt_gear_rank']
            belt_fort_rank = form_class.cleaned_data['belt_fort_rank']
            belt_fort_level = form_class.cleaned_data['belt_fort_level']


            if 'calculate' in request.POST:
                # Weapon GS
                if int(w_gear_rank) == 1:
                    if int(w_fort_rank) == 1:
                        w_gear_score = W_GEAR_SCORES[int(w_fort_level)]
                    else:
                        w_gear_score = W_GEAR_SCORES[int(w_fort_level) + 6]
                elif int(w_gear_rank) == 0:
                    w_gear_score = 0
                else:
                    if int(w_fort_rank) == 1:
                        w_gear_score = W_GEAR_SCORES[int(w_fort_level) + 12]
                    else:
                        w_gear_score = W_GEAR_SCORES[int(w_fort_level) + 18]

                #Off-Hand GS
                if int(off_gear_rank) == 1:
                    if int(off_fort_rank) == 1:
                        oh_gear_score = OH_GEAR_SCORES[int(off_fort_level)]
                    else:
                        oh_gear_score = OH_GEAR_SCORES[int(off_fort_level) + 6]
                elif int(off_gear_rank) == 0:
                    oh_gear_score = 0
                else:
                    if int(off_fort_rank) == 1:
                        oh_gear_score = OH_GEAR_SCORES[int(off_fort_level) + 12]
                    else:
                        oh_gear_score = OH_GEAR_SCORES[int(off_fort_level) + 18]

                #Head GS
                if int(head_gear_rank) == 1:
                    if int(head_fort_rank) == 1:
                        head_gear_score = HEAD_GEAR_SCORES[int(head_fort_level)]
                    else:
                        head_gear_score = HEAD_GEAR_SCORES[int(head_fort_level) + 6]
                elif int(head_gear_rank) == 0:
                    head_gear_score = 0
                else:
                    if int(head_fort_rank) == 1:
                        head_gear_score = HEAD_GEAR_SCORES[int(head_fort_level) + 12]
                    else:
                        head_gear_score = HEAD_GEAR_SCORES[int(head_fort_level) + 18]

                #Chest GS
                if int(chest_gear_rank) == 1:
                    if int(chest_fort_rank) == 1:
                        chest_gear_score = CHEST_GEAR_SCORES[int(chest_fort_level)]
                    else:
                        chest_gear_score = CHEST_GEAR_SCORES[int(chest_fort_level) + 6]
                elif int(chest_gear_rank) == 0:
                    chest_gear_score = 0
                else:
                    if int(head_fort_rank) == 1:
                        chest_gear_score = CHEST_GEAR_SCORES[int(chest_fort_level) + 12]
                    else:
                        chest_gear_score = CHEST_GEAR_SCORES[int(chest_fort_level) + 18]

                #Pants GS
                if int(pants_gear_rank) == 1:
                    if int(pants_fort_rank) == 1:
                        pants_gear_score = PANTS_GEAR_SCORES[int(pants_fort_level)]
                    else:
                        pants_gear_score = PANTS_GEAR_SCORES[int(pants_fort_level) + 6]
                elif int(pants_gear_rank) == 0:
                    pants_gear_score = 0
                else:
                    if int(head_fort_rank) == 1:
                        pants_gear_score = PANTS_GEAR_SCORES[int(pants_fort_level) + 12]
                    else:
                        pants_gear_score = PANTS_GEAR_SCORES[int(pants_fort_level) + 18]

                #Boots GS
                if int(boots_gear_rank) == 1:
                    if int(boots_fort_rank) == 1:
                        boots_gear_score = BOOTS_GEAR_SCORES[int(boots_fort_level)]
                    else:
                        boots_gear_score = BOOTS_GEAR_SCORES[int(boots_fort_level) + 6]
                elif int(boots_gear_rank) == 0:
                    boots_gear_score = 0
                else:
                    if int(head_fort_rank) == 1:
                        boots_gear_score = BOOTS_GEAR_SCORES[int(boots_fort_level) + 12]
                    else:
                        boots_gear_score = BOOTS_GEAR_SCORES[int(boots_fort_level) + 18]

                #Gloves GS
                if int(gloves_gear_rank) == 1:
                    if int(gloves_fort_rank) == 1:
                        gloves_gear_score = GLOVES_GEAR_SCORES[int(gloves_fort_level)]
                    else:
                        gloves_gear_score = GLOVES_GEAR_SCORES[int(gloves_fort_level) + 6]
                elif int(gloves_gear_rank) == 0:
                    gloves_gear_score = 0
                else:
                    if int(head_fort_rank) == 1:
                        gloves_gear_score = GLOVES_GEAR_SCORES[int(gloves_fort_level) + 12]
                    else:
                        gloves_gear_score = GLOVES_GEAR_SCORES[int(gloves_fort_level) + 18]

                #Shoulder GS
                if int(shoulder_gear_rank) == 1:
                    if int(shoulder_fort_rank) == 1:
                        shoulder_gear_score = SHOULDER_GEAR_SCORES[int(shoulder_fort_level)]
                    else:
                        shoulder_gear_score = SHOULDER_GEAR_SCORES[int(shoulder_fort_level) + 6]
                elif int(shoulder_gear_rank) == 0:
                    shoulder_gear_score = 0
                else:
                    if int(head_fort_rank) == 1:
                        shoulder_gear_score = SHOULDER_GEAR_SCORES[int(shoulder_fort_level) + 12]
                    else:
                        shoulder_gear_score = SHOULDER_GEAR_SCORES[int(shoulder_fort_level) + 18]

                #Belt GS
                if int(belt_gear_rank) == 1:
                    if int(belt_fort_rank) == 1:
                        belt_gear_score = BELT_GEAR_SCORES[int(belt_fort_level)]
                    else:
                        belt_gear_score = BELT_GEAR_SCORES[int(belt_fort_level) + 6]
                elif int(belt_gear_rank) == 0:
                    belt_gear_score = 0
                else:
                    if int(head_fort_rank) == 1:
                        belt_gear_score = BELT_GEAR_SCORES[int(belt_fort_level) + 12]
                    else:
                        belt_gear_score = BELT_GEAR_SCORES[int(belt_fort_level) + 18]

                result = (w_gear_score + oh_gear_score + head_gear_score + chest_gear_score + pants_gear_score +
                        boots_gear_score + gloves_gear_score + shoulder_gear_score + belt_gear_score)


            #form_class = GearscoreForm()
            # return redirect ('home:home')

        args = {'form': form_class, 'w_gear_score': w_gear_score, 'oh_gear_score': oh_gear_score,
                'head_gear_score': head_gear_score, 'chest_gear_score': chest_gear_score,
                'pants_gear_score': pants_gear_score, 'boots_gear_score': boots_gear_score,
                'gloves_gear_score': gloves_gear_score, 'shoulder_gear_score': shoulder_gear_score,
                'belt_gear_score': belt_gear_score, 'result':result}
        return render(request, self.template_name, args)


class SkillProgression(TemplateView):
    template_name = "app/skill_pro.html"

    def get(self, request, *args, **kwargs):
        return render(request, "app/skill_pro.html")

class Timers(TemplateView):
    template_name = "app/timers.html"

    def get(self, request, *args, **kwargs):
        return render(request, "app/timers.html")

class ShapeDoctor(TemplateView):
    template_name = "app/shapedoctor.html"

    def get(self, request, *args, **kwargs):
        return render(request, "app/shapedoctor.html")

class RuneDreaming(TemplateView):
    template_name = "app/rune_dreaming.html"

    def get(self, request, *args, **kwargs):
        form_class = GearRunesForm()
        return render(request, self.template_name, {'form': form_class})

    def post(self, request):
        form_class = GearRunesForm(request.POST)
        result_purple = 0
        result_white = 0
        result_yellow = 0
        result_green = 0
        result_red = 0
        if form_class.is_valid():
            w_rune_1 = form_class.cleaned_data['w_rune_1']
            w_rune_2 = form_class.cleaned_data['w_rune_2']
            w_rune_3 = form_class.cleaned_data['w_rune_3']
            w_rune_4 = form_class.cleaned_data['w_rune_4']
            w_rune_5 = form_class.cleaned_data['w_rune_5']

            off_rune_1 = form_class.cleaned_data['off_rune_1']
            off_rune_2 = form_class.cleaned_data['off_rune_2']
            off_rune_3 = form_class.cleaned_data['off_rune_3']
            off_rune_4 = form_class.cleaned_data['off_rune_4']
            off_rune_5 = form_class.cleaned_data['off_rune_5']

            head_rune_1 = form_class.cleaned_data['head_rune_1']
            head_rune_2 = form_class.cleaned_data['head_rune_2']
            head_rune_3 = form_class.cleaned_data['head_rune_3']
            head_rune_4 = form_class.cleaned_data['head_rune_4']
            head_rune_5 = form_class.cleaned_data['head_rune_5']

            chest_rune_1 = form_class.cleaned_data['chest_rune_1']
            chest_rune_2 = form_class.cleaned_data['chest_rune_2']
            chest_rune_3 = form_class.cleaned_data['chest_rune_3']
            chest_rune_4 = form_class.cleaned_data['chest_rune_4']
            chest_rune_5 = form_class.cleaned_data['chest_rune_5']

            pants_rune_1 = form_class.cleaned_data['pants_rune_1']
            pants_rune_2 = form_class.cleaned_data['pants_rune_2']
            pants_rune_3 = form_class.cleaned_data['pants_rune_3']
            pants_rune_4 = form_class.cleaned_data['pants_rune_4']
            pants_rune_5 = form_class.cleaned_data['pants_rune_5']

            gloves_rune_1 = form_class.cleaned_data['gloves_rune_1']
            gloves_rune_2 = form_class.cleaned_data['gloves_rune_2']
            gloves_rune_3 = form_class.cleaned_data['gloves_rune_3']
            gloves_rune_4 = form_class.cleaned_data['gloves_rune_4']
            gloves_rune_5 = form_class.cleaned_data['gloves_rune_5']

            boots_rune_1 = form_class.cleaned_data['boots_rune_1']
            boots_rune_2 = form_class.cleaned_data['boots_rune_2']
            boots_rune_3 = form_class.cleaned_data['boots_rune_3']
            boots_rune_4 = form_class.cleaned_data['boots_rune_4']
            boots_rune_5 = form_class.cleaned_data['boots_rune_5']

            shoulder_rune_1 = form_class.cleaned_data['shoulder_rune_1']
            shoulder_rune_2 = form_class.cleaned_data['shoulder_rune_2']
            shoulder_rune_3 = form_class.cleaned_data['shoulder_rune_3']
            shoulder_rune_4 = form_class.cleaned_data['shoulder_rune_4']
            shoulder_rune_5 = form_class.cleaned_data['shoulder_rune_5']

            belt_rune_1 = form_class.cleaned_data['belt_rune_1']
            belt_rune_2 = form_class.cleaned_data['belt_rune_2']
            belt_rune_3 = form_class.cleaned_data['belt_rune_3']
            belt_rune_4 = form_class.cleaned_data['belt_rune_4']
            belt_rune_5 = form_class.cleaned_data['belt_rune_5']

            if 'calculate' in request.POST:
                all_runes = []
                all_runes.append(int(w_rune_1))
                all_runes.append(int(w_rune_2))
                all_runes.append(int(w_rune_3))
                all_runes.append(int(w_rune_4))
                all_runes.append(int(w_rune_5))

                all_runes.append(int(off_rune_1))
                all_runes.append(int(off_rune_2))
                all_runes.append(int(off_rune_3))
                all_runes.append(int(off_rune_4))
                all_runes.append(int(off_rune_5))

                all_runes.append(int(head_rune_1))
                all_runes.append(int(head_rune_2))
                all_runes.append(int(head_rune_3))
                all_runes.append(int(head_rune_4))
                all_runes.append(int(head_rune_5))

                all_runes.append(int(chest_rune_1))
                all_runes.append(int(chest_rune_2))
                all_runes.append(int(chest_rune_3))
                all_runes.append(int(chest_rune_4))
                all_runes.append(int(chest_rune_5))

                all_runes.append(int(pants_rune_1))
                all_runes.append(int(pants_rune_2))
                all_runes.append(int(pants_rune_3))
                all_runes.append(int(pants_rune_4))
                all_runes.append(int(pants_rune_5))

                all_runes.append(int(gloves_rune_1))
                all_runes.append(int(gloves_rune_2))
                all_runes.append(int(gloves_rune_3))
                all_runes.append(int(gloves_rune_4))
                all_runes.append(int(gloves_rune_5))

                all_runes.append(int(boots_rune_1))
                all_runes.append(int(boots_rune_2))
                all_runes.append(int(boots_rune_3))
                all_runes.append(int(boots_rune_4))
                all_runes.append(int(boots_rune_5))

                all_runes.append(int(shoulder_rune_1))
                all_runes.append(int(shoulder_rune_2))
                all_runes.append(int(shoulder_rune_3))
                all_runes.append(int(shoulder_rune_4))
                all_runes.append(int(shoulder_rune_5))

                all_runes.append(int(belt_rune_1))
                all_runes.append(int(belt_rune_2))
                all_runes.append(int(belt_rune_3))
                all_runes.append(int(belt_rune_4))
                all_runes.append(int(belt_rune_5))

                for x in all_runes:
                    if x == 1:
                        result_purple += 1
                        result_white += 1
                        result_yellow += 1
                        result_green += 1
                        result_red += 1
                    elif x == 2:
                        result_red += 1
                    elif x == 3:
                        result_white += 1
                    elif x == 4:
                        result_yellow += 1
                    elif x == 5:
                        result_green += 1
                    elif x == 6:
                        result_purple += 1

        args = {'form': form_class, 'result_purple': result_purple, 'result_white': result_white,
                'result_yellow': result_yellow, 'result_green': result_green,
                'result_red': result_red}
        return render(request, self.template_name, args)


class BaseAtkCal(TemplateView):
    template_name = "app/baseatk.html"

    def get(self, request, *args, **kwargs):
        form_class = BaseATKForm()
        return render(request, self.template_name, {'form': form_class})

    def post(self, request):
        form_class = BaseATKForm(request.POST)
        result_attack = 0
        result_attack_output = 0
        result_attack_e_1_output = 0
        result_attack_e_2_output = 0
        result_attack_buff_output = 0
        result_attack_e_1 = 0
        result_attack_e_2 = 0
        result_cr_e_1 = 0
        result_cr_e_2 = 0
        result_cd_e_1 = 0
        result_cd_e_2 = 0
        result_ad_e_1 = 0
        result_ad_e_2 = 0
        result_attack_buff_plus = 0
        result_cr_buff_plus = 0
        result_cd_buff_plus = 0
        result_attack_buff = 0
        result_cr_buff = 0
        result_cd_buff = 0

        if form_class.is_valid():
            elixir = form_class.cleaned_data['elixir']
            panacea = form_class.cleaned_data['panacea']
            food = form_class.cleaned_data['food']
            base_atk = form_class.cleaned_data['base_atk']
            atk_bonus = form_class.cleaned_data['atk_bonus']
            crit_rate = form_class.cleaned_data['crit_rate']
            crit_dmg = form_class.cleaned_data['crit_dmg']
            all_dmg = form_class.cleaned_data['all_dmg']
            plus_atk_1 = form_class.cleaned_data['plus_atk_1']
            plus_atk_pct_1 = form_class.cleaned_data['plus_atk_pct_1']
            plus_cr_1 = form_class.cleaned_data['plus_cr_1']
            plus_cd_1 = form_class.cleaned_data['plus_cd_1']
            plus_all_dmg_1 = form_class.cleaned_data['plus_all_dmg_1']
            plus_atk_2 = form_class.cleaned_data['plus_atk_2']
            plus_atk_pct_2 = form_class.cleaned_data['plus_atk_pct_2']
            plus_cr_2 = form_class.cleaned_data['plus_cr_2']
            plus_cd_2 = form_class.cleaned_data['plus_cd_2']
            plus_all_dmg_2 = form_class.cleaned_data['plus_all_dmg_2']

            if 'calculate' in request.POST:
                result_attack = base_atk*(1+(atk_bonus/100))
                result_attack= round(result_attack, 1)
                result_attack_output = (result_attack*(1-(crit_rate/100))+result_attack*((crit_rate/100)*(crit_dmg/100)))*(1+(all_dmg/100))
                result_attack_output= round(result_attack_output, 1)

                result_attack_e_1 = (abs(base_atk)+plus_atk_1)*(1+(plus_atk_pct_1/100)+abs((atk_bonus/100)))
                result_attack_e_1 = round(result_attack_e_1, 1)
                result_cr_e_1 = abs(crit_rate)+plus_cr_1
                result_cd_e_1 = abs(crit_dmg)+plus_cd_1
                result_ad_e_1 = all_dmg+plus_all_dmg_1
                result_attack_e_1_output = (result_attack_e_1*(1-(result_cr_e_1/100))+result_attack_e_1*((result_cr_e_1/100)*(result_cd_e_1/100)))*(1+(result_ad_e_1/100))
                result_attack_e_1_output = round(result_attack_e_1_output, 1)

                result_attack_e_2 = (abs(base_atk) + plus_atk_2) * (1 + (plus_atk_pct_2/100) + abs((atk_bonus/100)))
                result_attack_e_2 = round(result_attack_e_2, 1)
                result_cr_e_2 = abs(crit_rate) + plus_cr_2
                result_cd_e_2 = abs(crit_dmg) + plus_cd_2
                result_ad_e_2 = all_dmg + plus_all_dmg_2
                result_attack_e_2_output = (result_attack_e_2 * (1 - (result_cr_e_2 / 100)) + result_attack_e_2 * (
                            (result_cr_e_2 / 100) * (result_cd_e_2 / 100))) * (1 + (result_ad_e_2 / 100))
                result_attack_e_2_output= round(result_attack_e_2_output, 1)

                if int(elixir) == 1:
                    result_attack_buff_plus += 15
                elif int(elixir) == 2:
                    result_cr_buff_plus += 4
                elif int(elixir) == 3:
                    result_cd_buff_plus += 18

                if int(panacea) == 1: #Blade
                    result_attack_buff_plus += 15
                elif int(panacea) == 2: #Superior Blade
                    result_attack_buff_plus += 20
                elif int(panacea) == 3: #Destruction
                    result_cd_buff_plus += 30
                elif int(panacea) == 4: #Superior Destruction
                    result_cd_buff_plus += 36
                elif int(panacea) == 5: #Hunter
                    result_cr_buff_plus += 6
                elif int(panacea) == 6: #Superior Sharpness
                    result_cr_buff_plus += 7.5

                if int(food) == 1: #Beef Curry
                    result_cd_buff_plus += 24
                elif int(food) == 2: #Tiger Shrimp
                    result_cr_buff_plus += 4.5

                result_attack_buff = abs(base_atk)*(1+(result_attack_buff_plus/100)+(atk_bonus/100))
                result_attack_buff = round(result_attack_buff, 1)
                result_cr_buff = abs(crit_rate) + result_cr_buff_plus
                result_cd_buff = abs(crit_dmg) + result_cd_buff_plus
                result_attack_buff_output = (result_attack_buff*(1-(result_cr_buff/100))+result_attack_buff*((result_cr_buff/100)*(result_cd_buff/100)))*(1+(all_dmg/100))
                result_attack_buff_output = round(result_attack_buff_output, 1)

            args = {'form': form_class, 'result_attack': result_attack, 'result_attack_output': result_attack_output,
                    'result_attack_e_1_output': result_attack_e_1_output, 'result_attack_e_2_output': result_attack_e_2_output,
                    'result_attack_buff_output': result_attack_buff_output, 'result_attack_e_1': result_attack_e_1,
                    'result_attack_e_2': result_attack_e_2, 'result_cr_e_1': result_cr_e_1, 'result_cd_e_2': result_cd_e_2,
                    'result_cr_e_2': result_cr_e_2, 'result_ad_e_1': result_ad_e_1, 'result_ad_e_2': result_ad_e_2,
                    'result_attack_buff_plus': result_attack_buff_plus, 'result_cr_buff_plus': result_cr_buff_plus,
                    'result_cd_buff_plus': result_cd_buff_plus, 'result_attack_buff': result_attack_buff,
                    'result_cr_buff': result_cr_buff, 'result_cd_buff': result_cd_buff, 'result_cd_e_1': result_cd_e_1}
            return render(request, self.template_name, args)
```

## File: mysite_project/asgi.py
```python
"""
ASGI config for mysite_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite_project.settings')

application = get_asgi_application()
```

## File: mysite_project/settings.py
```python
"""
Django settings for mysite_project project.

Generated by 'django-admin startproject' using Django 4.0.1.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.0/ref/settings/
"""
import os
import sys
import dj_database_url
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
from django.core.management.utils import get_random_secret_key

BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", get_random_secret_key())

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'bootstrap5',
    'myapp_bless',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
]

ROOT_URLCONF = 'mysite_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ["templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mysite_project.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.0/ref/settings/#databases
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
# Password validation
# https://docs.djangoproject.com/en/4.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.0/howto/static-files/

STATIC_URL = "/static/"
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static'),]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
# https://docs.djangoproject.com/en/4.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

## File: mysite_project/urls.py
```python
"""mysite_project URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from myapp_bless.views import (
    HomePageView,
    GSPage,
    SkillProgression,
    RuneDreaming,
    BaseAtkCal,
    Timers,
    ShapeDoctor,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path("", HomePageView.as_view(), name="home"),
    path("home", HomePageView.as_view(), name="home"),
    path("gearscore_cal", GSPage.as_view(), name="gearscore_cal"),
    path("skill_level_progression", SkillProgression.as_view(), name="skill_level_progression"),
    path("runes_dreaming", RuneDreaming.as_view(), name="runes_dreaming"),
    path("baseatkcal", BaseAtkCal.as_view(), name="baseatkcal"),
    path("timers", Timers.as_view(), name="timers"),
    path("shapedoctor", ShapeDoctor.as_view(), name="shapedoctor"),
]
```

## File: mysite_project/wsgi.py
```python
"""
WSGI config for mysite_project project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite_project.settings')

application = get_wsgi_application()
```

## File: static/css/night.css
```css
body.night-filter:before {
  pointer-events: none;
  content: '';
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgb(64, 64, 64);
  mix-blend-mode: multiply;
}
```

## File: static/css/pop.css
```css
.popup {
  z-index: 9;
  background-color: #f1f1f1;
  border: 1px solid #d3d3d3;
  text-align: center;
  min-height: 150px;
  min-width: 300px;
  max-height: 6000px;
  max-width: 4000px;
}

/*Drgable */

.popup {
  position: absolute;
  /*resize: both; !*enable this to css resize*! */
  overflow: auto;
}

.popup-header {
  padding: 10px;
  cursor: move;
  z-index: 10;
  background-color: #2196f3;
  color: #fff;
}

/*Resizeable*/

.popup .resizer-right {
  width: 5px;
  height: 100%;
  position: absolute;
  right: 0;
  bottom: 0;
  cursor: e-resize;
}

.popup .resizer-bottom {
  width: 100%;
  height: 5px;
  position: absolute;
  right: 0;
  bottom: 0;
  cursor: n-resize;
}

.popup .resizer-both {
  width: 5px;
  height: 5px;
  z-index: 10;
  position: absolute;
  right: 0;
  bottom: 0;
  cursor: nw-resize;
}

/*NOSELECT*/

.popup * {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome and Opera */
}

.font {
  font-size: 7vw;
}
```

## File: templates/app/base.html
```html
{% extends 'app/bootstrap.html' %}

{% load bootstrap5 %}

{% block bootstrap5_content %}

    <div class="col-lg-8 mx-auto p-3 py-md-5">
        <header class="d-flex align-items-center pb-3 mb-5 border-bottom">
            <nav class="navbar navbar-expand-lg navbar-light bg-light justify-content-md-center">
                <div class="container-fluid">
                    <a class="navbar-brand" href="home">{% block title %}BU Tools{% endblock %}</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                        <div class="navbar-nav">
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Calculators
                                </a>
                                <ul class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                                    <li><a class="dropdown-item" href="gearscore_cal">Gear Scores</a></li>
                                    <li><a class="dropdown-item" href="baseatkcal">Base Attack</a></li>
                                </ul>
                            </li>
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink2" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Info
                                </a>
                                <ul class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                                    <li><a class="dropdown-item" href="skill_level_progression">Skill Level Progression</a></li>
                                    <li><a class="dropdown-item" href="#">Useful Recipes</a></li>
                                </ul>
                            </li>
                            <a class="nav-link" href="runes_dreaming">Runes-Dreaming</a>
                            <a class="nav-link" href="timers">Timers</a>
                            <a class="nav-link" href="shapedoctor">Shape Doctor</a>
                            <a class="nav-link" href="#">Donate</a>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
        {% autoescape off %}{% bootstrap_messages %}{% endautoescape %}


        {% block content %}(no content){% endblock %}

    <footer class="pt-5 my-5 text-muted border-top">made with <em>love</em> by <strong>ForeztGump</strong>.</footer>

    </div>

{% endblock %}
```

## File: templates/app/baseatk.html
```html
{% extends 'app/base.html' %}
{% load bootstrap5 %}


{% block content %}

<div class="container-md">
    <h3>Baseline Damage Calculator</h3>
    <p>*calculate button is on the buttom of the form</p>
    <br/>
    <form role="form" method="post">
        {% csrf_token %}
        {{ form.non_field_errors }}
        <div class="row">
            <p>1. First, enter your "base" stats that you want to use as a baseline into the yellow cells below</p>
        </div>
        <div class="row">
            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>Base Attack</p></td>
                                <td>
                                    {{ form.base_atk.errors }}
                                    {{ form.base_atk }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Attack Bonus %</p></td>
                                <td>
                                    {{ form.atk_bonus.errors }}
                                    {{ form.atk_bonus }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Total Attack</p></td>
                                <td>
                                    <p>{{ result_attack }}</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>Crit Rate %</p></td>
                                <td>
                                    {{ form.crit_rate.errors }}
                                    {{ form.crit_rate }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Crit Damage %</p></td>
                                <td>
                                    {{ form.crit_dmg.errors }}
                                    {{ form.crit_dmg }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>All Damage %</p></td>
                                <td>
                                    {{ form.all_dmg.errors }}
                                    {{ form.all_dmg }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <br/>
                <h5 class="text-center">Average Baseline Damage Output</h5>
                <h5 class="text-center">{{ result_attack_output }}</h5>
            </div>
        </div>

        <br/>
        <div class="row">
            <p>2a. If interested in comparing gear, set the stats of the gear you want to compare between below.</p>
        </div>
        <div class="row">
            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>Equipement Piece A</p></td>
                                <td><p>&nbsp;</p></td>
                            </tr>
                            <tr>
                                <td><p>Plus Attack</p></td>
                                <td>
                                    {{ form.plus_atk_1.errors }}
                                    {{ form.plus_atk_1 }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Plus Attack %</p></td>
                                <td>
                                    {{ form.plus_atk_pct_1.errors }}
                                    {{ form.plus_atk_pct_1 }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Plus Cri Rate</p></td>
                                <td>
                                    {{ form.plus_cr_1.errors }}
                                    {{ form.plus_cr_1 }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Plus Cri Damage</p></td>
                                <td>
                                    {{ form.plus_cd_1.errors }}
                                    {{ form.plus_cd_1 }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Plus All Damage</p></td>
                                <td>
                                    {{ form.plus_all_dmg_1.errors }}
                                    {{ form.plus_all_dmg_1 }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>&nbsp;</p></td>
                                <td><p>&nbsp;</p></td>
                            </tr>

                            <tr>
                                <td><p>Attack</p></td>
                                <td><p>{{ result_attack_e_1 }}</p></td>
                            </tr>
                            <tr>
                                <td><p>Crit Rate %</p></td>
                                <td><p>{{ result_cr_e_1 }}</p></td>
                            </tr>
                            <tr>
                                <td><p>Crit Damage %</p></td>
                                <td><p>{{ result_cd_e_1 }}</p></td>
                            </tr>
                            <tr>
                                <td><p>All Damage %</p></td>
                                <td><p>{{ result_ad_e_1 }}</p></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <br/>
                <br/>
                <h5 class="text-center">New Average Baseline Damage Output</h5>
                <h5 class="text-center">{{result_attack_e_1_output}}</h5>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>Equipement Piece B</p></td>
                                <td><p>&nbsp;</p></td>
                            </tr>
                            <tr>
                                <td><p>Plus Attack</p></td>
                                <td>
                                    {{ form.plus_atk_2.errors }}
                                    {{ form.plus_atk_2 }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Plus Attack %</p></td>
                                <td>
                                    {{ form.plus_atk_pct_2.errors }}
                                    {{ form.plus_atk_pct_2 }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Plus Cri Rate</p></td>
                                <td>
                                    {{ form.plus_cr_2.errors }}
                                    {{ form.plus_cr_2 }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Plus Cri Damage</p></td>
                                <td>
                                    {{ form.plus_cd_2.errors }}
                                    {{ form.plus_cd_2 }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Plus All Damage</p></td>
                                <td>
                                    {{ form.plus_all_dmg_2.errors }}
                                    {{ form.plus_all_dmg_2 }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>&nbsp;</p></td>
                                <td><p>&nbsp;</p></td>
                            </tr>

                            <tr>
                                <td><p>Attack</p></td>
                                <td><p>{{ result_attack_e_2 }}</p></td>
                            </tr>
                            <tr>
                                <td><p>Crit Rate %</p></td>
                                <td><p>{{ result_cr_e_2 }}</p></td>
                            </tr>
                            <tr>
                                <td><p>Crit Damage %</p></td>
                                <td><p>{{ result_cd_e_2 }}</p></td>
                            </tr>
                            <tr>
                                <td><p>All Damage %</p></td>
                                <td><p>{{ result_ad_e_2 }}</p></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <br/>
                <br/>
                <h5 class="text-center">New Average Baseline Damage Output</h5>
                <h5 class="text-center">{{result_attack_e_2_output}}</h5>
            </div>
        </div>

        <br/>
        <div class="row">
            <p>2b. If interested in comparing Elixir/Panacea/Food buffs, choose from the three yellow drop-downs below. The total buffs and new output will be below.</p>
        </div>
        <div class="row">
            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>Elixer</p></td>
                                <td>
                                    {{ form.elixir.errors }}
                                    {{ form.elixir }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Panacea</p></td>
                                <td>
                                    {{ form.panacea.errors }}
                                    {{ form.panacea }}
                                </td>
                            </tr>
                            <tr>
                                <td><p>Food</p></td>
                                <td>
                                    {{ form.food.errors }}
                                    {{ form.food }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>Plus Attack</p></td>
                                <td><p>{{ result_attack_buff_plus }}</p></td>
                            </tr>
                            <tr>
                                <td><p>Plus Crit Rate %</p></td>
                                <td><p>{{ result_cr_buff_plus }}</p></td>
                            </tr>
                            <tr>
                                <td><p>Plus Crit Damage %</p></td>
                                <td><p>{{ result_cd_buff_plus }}</p></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <div class="table-responsive">
                    <table class="table">
                        <tbody>
                            <tr>
                                <td><p>Attack</p></td>
                                <td><p>{{ result_attack_buff }}</p></td>
                            </tr>
                            <tr>
                                <td><p>Total Crit Rate %</p></td>
                                <td><p>{{ result_cr_buff }}</p></td>
                            </tr>
                            <tr>
                                <td><p>Total Crit Damage %</p></td>
                                <td><p>{{ result_cd_buff }}</p></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="col">
                <br/>
                <h5 class="text-center">New Average Baseline Damage Output</h5>
                <h5 class="text-center">{{result_attack_buff_output}}</h5>
            </div>
        </div>

        <div class="row">
            <br/>
            <button type="submit" name="calculate" class="btn btn-success">Calculate</button>
            <br/>
        </div>
        <br/>
        <br/>
        <br/>
        <div class="row">
            <h4>FAQ</h4>
        </div>
        <div class="row">
            <div class="accordion accordion-flush" id="accordionFlushExample">
              <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingOne">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                    What if I want to test a combination of buffs, like gear AND food?
                  </button>
                </h2>
                <div id="flush-collapseOne" class="accordion-collapse collapse" aria-labelledby="flush-headingOne" data-bs-parent="#accordionFlushExample">
                  <div class="accordion-body">
                      Incorporate the stats into your baseline. For example, if I want to see what my output is like wearing pieces A and B, and Elixirs… then add the stats of A&B into the baseline then choose the Elixir.
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingTwo">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo" aria-expanded="false" aria-controls="flush-collapseTwo">
                    What if I have some other buff, like Zealots Fire giving me +10% crit rate?
                  </button>
                </h2>
                <div id="flush-collapseTwo" class="accordion-collapse collapse" aria-labelledby="flush-headingTwo" data-bs-parent="#accordionFlushExample">
                  <div class="accordion-body">
                      Incorporate the stats of that other buff into your baseline. Yes it works.
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingThree">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseThree" aria-expanded="false" aria-controls="flush-collapseThree">
                    My crit hits are huge, why should I care about average damage?
                  </button>
                </h2>
                <div id="flush-collapseThree" class="accordion-collapse collapse" aria-labelledby="flush-headingThree" data-bs-parent="#accordionFlushExample">
                  <div class="accordion-body">
                    Because in the long run, it all averages out. Imagine you did a 1000 hits with your attacks, your crits will be extremely close to your statistical crit rate * crit damage.
                    So, over the long run, sustained attacks might be better than the odd high crit. By looking at the average, you will see your true damage output.
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingFour">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseFour" aria-expanded="false" aria-controls="flush-collapseThree">
                    If my average damage is higher than another player's, do I hit harder?
                  </button>
                </h2>
                <div id="flush-collapseFour" class="accordion-collapse collapse" aria-labelledby="flush-headingFour" data-bs-parent="#accordionFlushExample">
                  <div class="accordion-body">
                    No, not necessarily. When comparing two players, there are many more factors to consider such as blessing and skill levels, buffs given by specific skills etc.
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingFive">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseFive" aria-expanded="false" aria-controls="flush-collapseThree">
                    I don't see my Elixir/Panacea/Food buff in the lists
                  </button>
                </h2>
                <div id="flush-collapseFive" class="accordion-collapse collapse" aria-labelledby="flush-headingFive" data-bs-parent="#accordionFlushExample">
                  <div class="accordion-body">
                      Be a champ, contribute to this webapp development by giving suggestion in my guild discord.
                  </div>
                </div>
              </div>
              <div class="accordion-item">
                <h2 class="accordion-header" id="flush-headingSix">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseSix" aria-expanded="false" aria-controls="flush-collapseThree">
                    I have a suggested improvement!
                  </button>
                </h2>
                <div id="flush-collapseSix" class="accordion-collapse collapse" aria-labelledby="flush-headingSix" data-bs-parent="#accordionFlushExample">
                  <div class="accordion-body">
                      Wonderful! Please speak to your nearest NoDamageSquad or PotHeads guild member
                  </div>
                </div>
              </div>
            </div>
        </div>
    </form>
</div>


{% endblock %}
```

## File: templates/app/bootstrap.html
```html
{% extends 'bootstrap5/bootstrap5.html' %}

{% block bootstrap5_title %}{% block title %}{% endblock %}{% endblock %}
```

## File: templates/app/gs.html
```html
{% extends 'app/base.html' %}
{% load bootstrap5 %}


{% block content %}
<div class="container text-center">

    <h3>Gear Score Calculator</h3>
      <br/>

    <form role="form" method="post">
        {% csrf_token %}
        {{ form.non_field_errors }}
        <table class="table table-success table-striped">
          <thead>
            <tr>
              <th scope="col">Gear</th>
              <th scope="col">Rank</th>
              <th scope="col">Fortify Rank</th>
              <th scope="col">Fortify Level</th>
              <th scope="col">Gear Scores</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Weapon</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.w_gear_rank.errors }}
                    {{ form.w_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.w_fort_rank.errors }}
                    {{ form.w_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.w_fort_level.errors }}
                    {{ form.w_fort_level }}
                  </div>
              </td>
              <td>
                  {{ w_gear_score }}
              </td>
            </tr>
            <tr>
              <th scope="row">Off-Hand Weapon</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.off_gear_rank.errors }}
                    {{ form.off_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.off_fort_rank.errors }}
                    {{ form.off_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.off_fort_level.errors }}
                    {{ form.off_fort_level }}
                  </div>
              </td>
              <td>
                  {{ oh_gear_score }}
              </td>
            </tr>
            <tr>
              <th scope="row">Helm</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.head_gear_rank.errors }}
                    {{ form.head_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.head_fort_rank.errors }}
                    {{ form.head_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.head_fort_level.errors }}
                    {{ form.head_fort_level }}
                  </div>
              </td>
              <td>
                  {{ head_gear_score }}
              </td>
            </tr>
            <tr>
              <th scope="row">Chest</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.chest_gear_rank.errors }}
                    {{ form.chest_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.chest_fort_rank.errors }}
                    {{ form.chest_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.chest_fort_level.errors }}
                    {{ form.chest_fort_level }}
                  </div>
              </td>
              <td>
                  {{ chest_gear_score }}
              </td>
            </tr>
            <tr>
              <th scope="row">Legs</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.pants_gear_rank.errors }}
                    {{ form.pants_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.pants_fort_rank.errors }}
                    {{ form.pants_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.pants_fort_level.errors }}
                    {{ form.pants_fort_level }}
                  </div>
              </td>
              <td>
                  {{ pants_gear_score }}
              </td>
            </tr>
            <tr>
              <th scope="row">Shoes</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.boots_gear_rank.errors }}
                    {{ form.boots_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.boots_fort_rank.errors }}
                    {{ form.boots_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.boots_fort_level.errors }}
                    {{ form.boots_fort_level }}
                  </div>
              </td>
              <td>
                  {{ boots_gear_score }}
              </td>
            </tr>
            <tr>
              <th scope="row">Gloves</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.gloves_gear_rank.errors }}
                    {{ form.gloves_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.gloves_fort_rank.errors }}
                    {{ form.gloves_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.gloves_fort_level.errors }}
                    {{ form.gloves_fort_level }}
                  </div>
              </td>
              <td>
                  {{ gloves_gear_score }}
              </td>
            </tr>
            <tr>
              <th scope="row">Shoulder</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.shoulder_gear_rank.errors }}
                    {{ form.shoulder_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.shoulder_fort_rank.errors }}
                    {{ form.shoulder_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.shoulder_fort_level.errors }}
                    {{ form.shoulder_fort_level }}
                  </div>
              </td>
              <td>
                  {{ shoulder_gear_score }}
              </td>
            </tr>
            <tr>
              <th scope="row">Waist</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.belt_gear_rank.errors }}
                    {{ form.belt_gear_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.belt_fort_rank.errors }}
                    {{ form.belt_fort_rank }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.belt_fort_level.errors }}
                    {{ form.belt_fort_level }}
                  </div>
              </td>
              <td>
                  {{ belt_gear_score }}
              </td>
            </tr>
          </tbody>
        </table>
        <br/>
        <button type="submit" name="calculate" class="btn btn-secondary">Calculate Gear Score</button>
        <br/>
        <br/>
        <h2>Your Total Gear Scores:  {{ result }}</h2>
    </form>
</div>
{% endblock %}
```

## File: templates/app/home.html
```html
{% extends 'app/base.html' %}
{% load bootstrap5 %}


{% block content %}
<h3>Welcome</h3>
<p>feel free to use and if you have any suggestions please submit them at my guild discord</p>
<p><strong>PotHeads</strong> discord link - <a href="https://discord.gg/GxtaPQ9ntb">https://discord.gg/GxtaPQ9ntb</a></p>
<p>This project is still under development. If the site is down, just wait for 5 mins before using.</p>
<br/>
<h4>Special Thanks</h4>
<p>nodamagesquad guild</p>
<p>OGWaffle</p>
<p>ffsquirrel</p>
<p>Gomar</p>
<p>Quaxko</p>

{% endblock %}
```

## File: templates/app/rune_dreaming.html
```html
{% extends 'app/base.html' %}
{% load bootstrap5 %}


{% block content %}
<div class="container text-center">

    <h3>Runes Dreaming</h3>
      <br/>

    <form role="form" method="post">
        {% csrf_token %}
        {{ form.non_field_errors }}
        <table class="table table-success table-striped">
          <thead>
            <tr>
              <th scope="col">Gear</th>
              <th scope="col">Slot 1</th>
              <th scope="col">Slot 2</th>
              <th scope="col">Slot 3</th>
              <th scope="col">Slot 4</th>
              <th scope="col">Slot 5</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Weapon</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.w_rune_1.errors }}
                    {{ form.w_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.w_rune_2.errors }}
                    {{ form.w_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.w_rune_3.errors }}
                    {{ form.w_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.w_rune_4.errors }}
                    {{ form.w_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.w_rune_5.errors }}
                    {{ form.w_rune_5 }}
                  </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Off-Hand Weapon</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.off_rune_1.errors }}
                    {{ form.off_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.off_rune_2.errors }}
                    {{ form.off_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.off_rune_3.errors }}
                    {{ form.off_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.off_rune_4.errors }}
                    {{ form.off_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.off_rune_5.errors }}
                    {{ form.off_rune_5 }}
                  </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Helm</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.head_rune_1.errors }}
                    {{ form.head_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.head_rune_2.errors }}
                    {{ form.head_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.head_rune_3.errors }}
                    {{ form.head_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.head_rune_4.errors }}
                    {{ form.head_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.head_rune_5.errors }}
                    {{ form.head_rune_5 }}
                  </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Chest</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.chest_rune_1.errors }}
                    {{ form.chest_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.chest_rune_2.errors }}
                    {{ form.chest_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.chest_rune_3.errors }}
                    {{ form.chest_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.chest_rune_4.errors }}
                    {{ form.chest_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.chest_rune_5.errors }}
                    {{ form.chest_rune_5 }}
                  </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Legs</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.pants_rune_1.errors }}
                    {{ form.pants_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.pants_rune_2.errors }}
                    {{ form.pants_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.pants_rune_3.errors }}
                    {{ form.pants_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.pants_rune_4.errors }}
                    {{ form.pants_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.pants_rune_5.errors }}
                    {{ form.pants_rune_5 }}
                  </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Shoes</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.boots_rune_1.errors }}
                    {{ form.boots_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.boots_rune_2.errors }}
                    {{ form.boots_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.boots_rune_3.errors }}
                    {{ form.boots_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.boots_rune_4.errors }}
                    {{ form.boots_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.boots_rune_5.errors }}
                    {{ form.boots_rune_5 }}
                  </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Gloves</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.gloves_rune_1.errors }}
                    {{ form.gloves_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.gloves_rune_2.errors }}
                    {{ form.gloves_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.gloves_rune_3.errors }}
                    {{ form.gloves_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.gloves_rune_4.errors }}
                    {{ form.gloves_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.gloves_rune_5.errors }}
                    {{ form.gloves_rune_5 }}
                  </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Shoulder</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.shoulder_rune_1.errors }}
                    {{ form.shoulder_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.shoulder_rune_2.errors }}
                    {{ form.shoulder_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.shoulder_rune_3.errors }}
                    {{ form.shoulder_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.shoulder_rune_4.errors }}
                    {{ form.shoulder_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.shoulder_rune_5.errors }}
                    {{ form.shoulder_rune_5 }}
                  </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Waist</th>
              <td>
                  <div class="fieldWrapper">
                    {{ form.belt_rune_1.errors }}
                    {{ form.belt_rune_1 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.belt_rune_2.errors }}
                    {{ form.belt_rune_2 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.belt_rune_3.errors }}
                    {{ form.belt_rune_3 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.belt_rune_4.errors }}
                    {{ form.belt_rune_4 }}
                  </div>
              </td>
              <td>
                  <div class="fieldWrapper">
                    {{ form.belt_rune_5.errors }}
                    {{ form.belt_rune_5 }}
                  </div>
              </td>
            </tr>
          </tbody>
        </table>
        <br/>
        <button type="submit" name="calculate" class="btn btn-secondary">Calculate Runes</button>
        <br/>
        <br/>
        {% load static %}
        <h2> <img src="{% static 'img/purple.png' %}" alt="purple"> {{ result_purple }} : <img src="{% static 'img/white.png' %}" alt="white"> {{ result_white }} : <img src="{% static 'img/yellow.png' %}" alt="yellow"> {{ result_yellow }} : <img src="{% static 'img/red.png' %}" alt="red"> {{ result_red }} : <img src="{% static 'img/green.png' %}" alt="green"> {{ result_green }}</h2>
        <h4>Don't Stop Dreaming</h4>
    </form>
</div>
{% endblock %}
```

## File: templates/app/shapedoctor.html
```html
{% extends 'app/base.html' %}
{% load bootstrap5 %}


{% block content %}

{% load static %}
<link rel="stylesheet" type='text/css' href="{% static 'css/pop.css' %}">
<link rel="stylesheet" type='text/css' href="{% static 'css/night.css' %}">

<script type="text/javascript">
  //contains all of the potentials that are saved
		let list_of_potentials = [];

		//the hexagon for image 1 is adjacent to image 2,3,5, etc
		//save all these relationships in an array
		//an individual hexagon can be adjacent with up to 6 other hexagons
		//0 indicates none
		//the order matters, [top, topleft, bottomleft, bottom, bottomright, topright]
		let adjacent_list = [

			[0, 0, 0, 0, 0, 0],

			[0, 0, 2, 5, 3, 0],
			[0, 0, 4, 7, 5, 1],
			[0, 1, 5, 8, 6, 0],
			[0, 0, 0, 9, 7, 2],
			[1, 2, 7, 10, 8, 3],

			[0, 3, 8, 11, 0, 0],
			[2, 4, 9, 12, 10, 5],
			[3, 5, 10, 13, 11, 6],
			[4, 0, 0, 14, 12, 7],
			[5, 7, 12, 15, 13, 8],

			[6, 8, 13, 16, 0, 0],
			[7, 9, 14, 17, 15, 10],
			[8, 10, 15, 18, 16, 11],
			[9, 0, 0, 19, 17, 12],
			[10, 12, 17, 20, 18, 13],

			[11, 13, 18, 21, 0, 0],
			[12, 14, 19, 22, 20, 15],
			[13, 15, 20, 23, 21, 16],
			[14, 0, 0, 0, 22, 17],
			[15, 17, 22, 24, 23, 18],

			[16, 18, 23, 0, 0, 0],
			[17, 19, 0, 0, 24, 20],
			[18, 20, 24, 0, 0, 21],
			[20, 22, 0, 0, 0, 23]

		];

		//this will contain a large number of solutions, each of which is an array
		let list_of_solutions = [];
		let list_of_searched = [];
		let list_of_best_solutions = [];
		let current_solution = -1;


		function next_solution() {

			//no solutions, don't do anything
			if (list_of_best_solutions.length == 0) {
				return;
			}

			//increment the solution
			current_solution = current_solution + 1;

			if (current_solution >= list_of_best_solutions.length) {
				current_solution = 0;
			}

			display_solution();

		}

		function prev_solution() {

			//no solutions, don't do anything
			if (list_of_best_solutions.length == 0) {
				return;
			}

			//decrement the solution
			current_solution = current_solution - 1;

			if (current_solution < 0) {
				current_solution = list_of_best_solutions.length - 1;
			}

			display_solution();

		}

		function display_solution() {

			let solution = [];
			let color = 0;

			deselect_all();

			solution = list_of_best_solutions[current_solution];
			//alert("solution " + current_solution + ": " + solution);



			for (var i = 0; i <= 24; i++ ){

				if (solution[i] != -1) {

					color = solution[i] % 5;
					//alert("color: " + color);

					set_image(i,color);

				}
			}

		}


		function set_image(tile_number, color) {

			var image = document.getElementById(tile_number);

			//if (color == 0) {
			//		image.src = "hex.png";
			//}

			if (color == 0) {
					image.src = "{% static 'img/hex-blue.png' %}";
			}

			if (color == 1) {
					image.src = "{% static 'img/hex-green.png' %}";
			}

			if (color == 2) {
					image.src = "{% static 'img/hex-orange.png' %}";
			}

			if (color == 3) {
					image.src = "{% static 'img/hex-purple.png' %}";
			}

			if (color == 4) {
					image.src = "{% static 'img/hex-red.png' %}";
			}

		}

		//unselects all tiles
		function deselect_all() {
			for (var i = 1; i <= 24; i++ ) {
				var image = document.getElementById(i);
				//if (image.getAttribute('src') === 'hex-blue.png') {
					image.src = "{% static 'img/hex.png' %}";
				//}
			}
		}

		//use the 4 tile potentials saved in the "list_of_potentials" array and try to fit as many as possible
		//into an area of 24 hex tiles
		//each potential from the "list_of_potentials" may only be used once per solution
		function solve_button() {
			list_of_solutions.length = 0;
			list_of_searched.length = 0;
			list_of_best_solutions.length = 0;

			let solution = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
			let count = 0;
			let bestcount = 24;
			let bestsolution = "";

			solve(solution, 0);

			//alert("number of solutions: " + list_of_solutions.length );
			console.log(list_of_solutions);

			//search through the list of solutions and see what the best solutions are
			for (var i = 0; i < list_of_solutions.length; i++) {
				solution = list_of_solutions[i];
				count = 0;

				//check each tile of the solution and count the empty tiles (-1)
				for (var j = 0; j < solution.length; j++) {
					if (solution[j] == -1) {
						count = count + 1;
					}
				}

				//update the results
				if (count == bestcount) {
					bestsolution = bestsolution + " " + i;
					list_of_best_solutions.push(solution);
				} else if (count < bestcount) {
					bestcount = count;
					bestsolution = "" + i;
					list_of_best_solutions.length = 0;
					list_of_best_solutions.push(solution);
				}

			} //end looping through all of the found solutions

			console.log("bestcount: " + bestcount + " bestsolution:" + bestsolution);
			update_best_solutions();
		}

		//returns true if this function is able to place a potential at any position
		//returns false if no potentials were able to be placed in the solution
		function solve(solution, potential) {

			let tempsolution = [];
			let result = false;
			let fit_result = false;
			let solve_result = false;
			let used = [];

			list_of_searched.push(solution + potential);

			//end of the recursive function call because it's the last potential in the list of potentials
			if (potential==list_of_potentials.length) {
				return false;
			}

			//try to put the potential at each of the 24 positions
			for (var i = 1; i <= 24; i++) {
				used.length = 0;
				tempsolution = [...solution];

				//try to place the potential at the current position
				fit_result = fit_potential(potential, tempsolution, i, -1, used);

				if (fit_result == true) {
					//the potential was able to fit at at least one position so the function should return true
					result=true;
				}

				//if there are more potentials remaining in the list try to place those in the solution as well
				if (potential<list_of_potentials.length-1) {
					//eliminate duplicate checks during the brute force search, this reduces the amount off searching by a lot
					if(list_of_searched.includes(tempsolution + (potential+1)) == false) {
						solve_result = solve(tempsolution, potential+1);
						if (solve_result==false) {
							//console.log("Tried to call solve() on potential:" + (potential+1) + " and failed. Adding " + tempsolution);
							list_of_solutions.push(tempsolution);
						}
					}
				} else {
					if(fit_result==true) {
						//console.log("fit piece and no more potentials, adding " + tempsolution);
						list_of_solutions.push(tempsolution);
					}
				}
			} //end of checking each position for this potential

			return result;
		}

		//index_of_potential is the number of which potential in the list_of_potentials array that should be added
		//solution is an array where each index represents either -1 for empty or the ID of which potential is placed there
		//solution_offset is the tile that should be used in the solution
		//potential_offset is the tile that should be used from the potential
		//used is an array that indicates which tiles of the potential have already been placed in the solution
		//return either true if the fit worked, false if there was an overlap or the potential was out of bounds
		function fit_potential(index_of_potential, solution, solution_offset, potential_offset, used) {

			//make a temporary copy of the solution
			//the loop in this function will attempt to fit the potential to the current solution
			//if the potential fits then the "temporary solution" will be copied to the solution
			//and the function will return true to indicate that it was successful
			let tempsolution = [...solution];
			let char = "";
			let potential = "";
			let adjacent = "";
			let solution_adjacent = "";
			let result = "";

			//get the potential from the list
			potential = list_of_potentials[index_of_potential];

			//alert("fit potential " + index_of_potential + ": " + potential + " to solution offset " + solution_offset + " potential offset " + potential_offset);

			//if the potential offset is negative one then check to see where the first selected tile is of the potential
			if (potential_offset==-1) {
				//loop through each digit of the potential
				for (var i = 0; i < potential.length; i++) {
					char = potential.charAt(i);
					if (char == "1") {
						potential_offset = i+1;
						break;
					}
				}
			}

			//place the first tile of the potential at the solution offset in the temp solution
			if (tempsolution[solution_offset]==-1) {
				tempsolution[solution_offset] = index_of_potential;
				used.push(potential_offset);
				//alert("temp solution: " + tempsolution);
			} else {
				//alert("Can not place potential number " + index_of_potential + " at tile " + solution_offset + " because it is already used.");
				return false;
			}

			//get the adjacent tiles of the potential
			adjacent = adjacent_list[potential_offset];

			//get the adjacent tiles for the offset tile in the solution
			solution_adjacent = adjacent_list[solution_offset];

			//for all of the adjacent tiles call fit_potential again as needed
			for (var j = 0; j < 6; j++) {

				if (adjacent[j] == 0) {
					//no need to do anything, this tile of the potential is out of bounds
				} else if (adjacent[j] !== 0 && potential.charAt(adjacent[j]-1) == 0) {
					//no need to do anything, there was a tile adjacent to this one but it was not selected in the potential
				} else if (adjacent[j] !== 0 && potential.charAt(adjacent[j]-1) == 1) {
					//there is a valid tile adjacent to the current tile and it is selected
					//check to see if that tile of the potential was already put in the solution
					if (used.includes(adjacent[j])) {
						//no need to do anything, this tile in the potential was already placed in the solution
					} else {
						//if a tile is found in the potential that is selected and needs to be placed in the solution
						//figure out which tile of the solution this should be placed at
						temp_solution_offset = solution_adjacent[j];

						//if the solution offset is 0 that means it would be out of bounds so the potential can't fit here in the solution
						if(temp_solution_offset == 0) {
							return false;
						} else {
							//place the adjacent tiles in the solution
							result = fit_potential(index_of_potential, tempsolution, temp_solution_offset, adjacent[j], used);
							if (result == false) {
								return false;
							}
						}
					}
				}
			} //end looping through the 6 adjacent tiles

			//if all of the peices were placed with no errors, and this function wasn't returned earlier in the loop then the temp solution can be copied to the solution
			//alert("end of solve: temp solution " + tempsolution);
			solution.length = 0;
			solution.push(...tempsolution);
			return true;
		}

		//changes the source of an individual tile between the white and blue image
		function toggle_image(id){
			var image = document.getElementById(id);
			if (image.getAttribute('src') === '{% static 'img/hex.png' %}') {
				image.src = "{% static 'img/hex-blue.png' %}";
			} else if (image.getAttribute('src') === '{% static 'img/hex-blue.png' %}') {
				image.src = "{% static 'img/hex.png' %}";
			}
		}

		//if 4 tiles are selected then save it in a list, otherwise error
		function save_potential() {
				let count = 0;
				let result = "";

				var image1 = document.getElementById('1');
				var image2 = document.getElementById('2');
				var image3 = document.getElementById('3');
				var image4 = document.getElementById('4');
				var image5 = document.getElementById('5');
				var image6 = document.getElementById('6');
				var image7 = document.getElementById('7');
				var image8 = document.getElementById('8');
				var image9 = document.getElementById('9');
				var image10 = document.getElementById('10');
				var image11 = document.getElementById('11');
				var image12 = document.getElementById('12');
				var image13 = document.getElementById('13');
				var image14 = document.getElementById('14');
				var image15 = document.getElementById('15');
				var image16 = document.getElementById('16');
				var image17 = document.getElementById('17');
				var image18 = document.getElementById('18');
				var image19 = document.getElementById('19');
				var image20 = document.getElementById('20');
				var image21 = document.getElementById('21');
				var image22 = document.getElementById('22');
				var image23 = document.getElementById('23');
				var image24 = document.getElementById('24');

				if (image1.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image2.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image3.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image4.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image5.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image6.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image7.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image8.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image9.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image10.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image11.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image12.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image13.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image14.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image15.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image16.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image17.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image18.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image19.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image20.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image21.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image22.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image23.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}
				if (image24.getAttribute('src') === '{% static 'img/hex.png' %}') { result += "0";} else { result += "1"; count++;}

				if (count != 4) {
					alert("Must have 4 tiles selected to save");
				} else if (check_potential(result) != 4) {
					alert("All tiles must be connected");
				} else {
					list_of_potentials.push(result);
					update_list();
				}

		}

		//prints the list of potentials to the console log
		function print_potentials() {
			window.console.log("potentials:")
			for (var i = 0; i < list_of_potentials.length; i++ ){
				window.console.log(list_of_potentials[i]);
			}
		}

		//updates the displayed HTML list of potentials
		function update_list() {
			let innerhtml = "";
			for (var i = 0; i < list_of_potentials.length; i++) {
				innerhtml += '<li>' + i + ': ' + list_of_potentials[i] + '</li>';
			}
			document.getElementById('list').innerHTML = innerhtml;
		}

		function update_best_solutions() {
			let innerhtml = "";
			let solution = "";

			for (var i = 0; i < list_of_best_solutions.length; i++) {
				solution = list_of_best_solutions[i];
				//solution.shift(); //drop the leading -1 for tile 0 that doesn't exist
				innerhtml += '<li>' + i + ': ' + solution + '</li>';
			}
			document.getElementById('list_of_best_solutions').innerHTML = innerhtml;

			document.getElementById('total_solutions').innerHTML = list_of_solutions.length;
			document.getElementById('best_solutions').innerHTML = list_of_best_solutions.length;
		}

		//verify that the 4 selected tiles are connected
		//an individual tile can not be floating on its own
		//returns the count of connected adjacent tiles
		function check_potential(potential) {
			let char = ""
			let found = [];

			//loop through each digit
			for (var i = 0; i < potential.length; i++) {
				char = potential.charAt(i);

				//found a selected tile
				if (char == "1") {
					//alert("first selected tile found at " + (i+1));
					found.push(i+1);
					count_adjacent(i+1,found,potential);
					break;
				}
			}

			return found.length;
		}


		//recursive function
		//check how many selected tiles are adjacent to this position
		//tile is the specific tile to check
		//potential is the 1's and 0's that represent wether each tile is selected or not
		//found is an array of all adjacent tiles that have been found so far
		function count_adjacent(tile,found,potential) {
			let adjacent = [];

			//figure out which tiles are adacent to the selected tile
			adjacent = adjacent_list[tile];

			//loop through which tiles are adjacent to the selected tile
			for (var j = 0; j < adjacent.length; j++) {

				//ignore any adjacent tiles for 0, those are empty
				if (adjacent[j] != 0) {

					//alert("tile " + (tile+1) + " is adjacent to: " + adjacent[j]);
					//alert("tile at " + adjacent[j] + " is " + potential.charAt(adjacent[j]-1));

					if (potential.charAt(adjacent[j]-1) == 1) {

						//check to see if this tile was counted already
						if (!found.includes(adjacent[j])) {
							found.push(adjacent[j]);
							count_adjacent(adjacent[j],found,potential);
						}
					}
				}
			} //end checking the adjacent tiles for a specific tile
		}
</script>


<div class="container">

  <div class="row">
    <div class="col">
      <h2>Shape Doctor</h2>
      <p>"Because aint nobody got time to do this manually" By OGWaffle</p>
      <p>Special Thanks to OGWaffle for making this possible!</p>
      <p>version: beta1.1</p>
        <br/>
    </div>
    <div class="col">
      <h3>Instructions</h3>
      <ul class="list-unstyled">
        <li>**Important**:
          <ul>
            <li>Please select exactly 4 tiles before saving it as a potentials</li>
            <li>If you find any bugs, please report to me or OGWaffle</li>
            <li>Sorry if you have a small screen. I will make it responsive soon</li>
          </ul>
        </li>
        <li>Steps:
          <ul>
            <li>Draw out the potential that you want to use 1 by 1</li>
            <li>Click "Save Potential" after you done drawing</li>
            <li>Repeat steps 1 and 2 if you want to add more potentials</li>
            <li>Click "Solve" and wait until you see number popping up on "Total Solutions"</li>
            <li>Webapp will solve the puzzle and give to possible solution</li>
            <li>Use "Next Best Solution" and "Prev Best Solution" to view between each solution</li>
            <li>Click "Restart" to start over</li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
  <br/>
</div>

<div class="container">
  <div class="row">
  <div id="potentialbuilder" style="height:1130px; width:875px; position:relative; background-color:#e3e3e3">
		<img id="1" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:0px;left:328px;" onclick="toggle_image('1');">
		<img id="2" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:95px;left:164px;" onclick="toggle_image('2');">
		<img id="3" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:95px;left:492px;" onclick="toggle_image('3');">
		<img id="4" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:188px;left:0px;" onclick="toggle_image('4');">
		<img id="5" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:188px;left:328px;" onclick="toggle_image('5');">
		<img id="6" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:188px;left:655px;" onclick="toggle_image('6');">
		<img id="7" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:281px;left:164px;" onclick="toggle_image('7');">
		<img id="8" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:281px;left:492px;" onclick="toggle_image('8');">
		<img id="9" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:376px;left:0px;" onclick="toggle_image('9');">
		<img id="10" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:376px;left:328px;" onclick="toggle_image('10');">
		<img id="11" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:376px;left:655px;" onclick="toggle_image('11');">
		<img id="12" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:470px;left:164px;" onclick="toggle_image('12');">
		<img id="13" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:470px;left:492px;" onclick="toggle_image('13');">
		<img id="14" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:564px;left:0px;" onclick="toggle_image('14');">
		<img id="15" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:564px;left:328px;" onclick="toggle_image('15');">
		<img id="16" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:564px;left:655px;;" onclick="toggle_image('16');">
		<img id="17" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:658px;left:164px;" onclick="toggle_image('17');">
		<img id="18" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:658px;left:492px;" onclick="toggle_image('18');">
		<img id="19" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:752px;left:0px;" onclick="toggle_image('19');">
		<img id="20" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:752px;left:328px;" onclick="toggle_image('20');">
		<img id="21" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:752px;left:655px;" onclick="toggle_image('21');">
		<img id="22" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:846px;left:164px;" onclick="toggle_image('22');">
		<img id="23" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:846px;left:492px;" onclick="toggle_image('23');">
		<img id="24" src="{% static 'img/hex.png' %}" alt="hex" style="position:absolute;top:940px;left:328px;" onclick="toggle_image('24');">
	</div>

	<div id="buttons" style="postion:relative; border-width:1px; border-style:solid; border-color:black; height:79px; width:873px; background-color:#d4d4d4;" />


    <div style="display:inline; float:left;">
      Total Solutions: <div id="total_solutions" style="display:inline">0</div>&nbsp;&nbsp;
  		Best Solutions: <div id="best_solutions" style="display:inline">0</div>&nbsp;&nbsp;
    </div>

		<div style="display:inline; float:right;">
      <input id="clickMe" type="button" value="Save Potential" onclick="save_potential();">
    	<input id="clickMe" type="button" value="Solve" onclick="solve_button();">
    	<input id="clickMe" type="button" value="Deselect All Tiles" onclick="deselect_all();">
      <input id="clickMe" type="button" value="Restart" onclick="window.location.reload();">
      <pre></pre>
  		<input style="float: right;" id="clickMe" type="button" value="Next Best Solution" onclick="next_solution();">
  		<input style="float: right;" id="clickMe" type="button" value="Prev Best Solution" onclick="prev_solution();">
		</div>
  </div>

  <div class="row">
    <div class="col">
    	Potentials:
    	<ul id="list"></ul>
    </div>
  </div>

  <div hidden>
  	Solutions:
  	<ul id="list_of_best_solutions"></ul>
  </div>
  <br>

</div>
{% endblock %}
```

## File: templates/app/skill_pro.html
```html
{% extends 'app/base.html' %}
{% load bootstrap5 %}


{% block content %}
<div class="container text-center">

  <h3>Skill Level Progression</h3>
  <br/>

  <div class="table-responsive">
    <table class="table table-striped">
      <thead>
        <tr>
          <th scope="col">Type/Level</th>
          <th scope="col">1</th>
          <th scope="col">2</th>
          <th scope="col">3</th>
          <th scope="col">4</th>
          <th scope="col">5</th>
          <th scope="col">6</th>
          <th scope="col">7</th>
          <th scope="col">8</th>
          <th scope="col">9</th>
          <th scope="col">10</th>
          <th scope="col">11</th>
          <th scope="col">12</th>
          <th scope="col">13</th>
          <th scope="col">14</th>
          <th scope="col">15</th>
          <th scope="col">16</th>
          <th scope="col">17</th>
          <th scope="col">18</th>
          <th scope="col">19</th>
          <th scope="col">20</th>
          <th scope="col">21</th>
          <th scope="col">22</th>
          <th scope="col">23</th>
          <th scope="col">24</th>
          <th scope="col">25</th>
          <th scope="col">26</th>
          <th scope="col">27</th>
          <th scope="col">28</th>
          <th scope="col">29</th>
          <th scope="col">30</th>
          <th scope="col">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Buff</th>
          <td>3</td>
          <td>5</td>
          <td>10</td>
          <td>15</td>
          <td>20</td>
          <td>52</td>
          <td>154</td>
          <td>392</td>
          <td>842</td>
          <td>MAX</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>1493</td>
        </tr>
        <tr>
          <th scope="row">Utility</th>
          <td>1</td>
          <td>3</td>
          <td>5</td>
          <td>7</td>
          <td>9</td>
          <td>12</td>
          <td>15</td>
          <td>20</td>
          <td>25</td>
          <td>30</td>
          <td>42</td>
          <td>56</td>
          <td>75</td>
          <td>100</td>
          <td>131</td>
          <td>167</td>
          <td>209</td>
          <td>258</td>
          <td>312</td>
          <td>MAX</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>1477</td>
        </tr>
        <tr>
          <th scope="row">Damage</th>
          <td>1</td>
          <td>1</td>
          <td>2</td>
          <td>2</td>
          <td>3</td>
          <td>4</td>
          <td>5</td>
          <td>6</td>
          <td>7</td>
          <td>8</td>
          <td>9</td>
          <td>10</td>
          <td>12</td>
          <td>13</td>
          <td>17</td>
          <td>21</td>
          <td>27</td>
          <td>34</td>
          <td>41</td>
          <td>50</td>
          <td>66</td>
          <td>78</td>
          <td>90</td>
          <td>104</td>
          <td>118</td>
          <td>133</td>
          <td>154</td>
          <td>167</td>
          <td>185</td>
          <td>MAX</td>
          <td>1365</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

{% endblock %}
```

## File: templates/app/timers.html
```html
{% extends 'app/base.html' %}
{% load bootstrap5 %}


{% block content %}
{% load static %}
<link rel="stylesheet" type='text/css' href="{% static 'css/pop.css' %}">
<link rel="stylesheet" type='text/css' href="{% static 'css/night.css' %}">
<script type="text/javascript">
var Stopwatch = function(element, voice_option, options, time_limit, voice) {

  var timer = createTimer(),
    audio_backflow_in = document.getElementById("audio_backflow_in"),
    audio_backflow = document.getElementById("audio_backflow"),
    audio_fire_in = document.getElementById("audio_fire_in"),
    audio_fire = document.getElementById("audio_fire"),
    audio_reflect_in = document.getElementById("audio_reflect_in"),
    audio_reflect = document.getElementById("audio_reflect"),
    audio_lightning_in = document.getElementById("audio_lightning_in"),
    audio_lightning = document.getElementById("audio_lightning"),
    audio_fuse_storm = document.getElementById("audio_fuse_storm"),
    audio_fuse_storm_in = document.getElementById("audio_fuse_storm_in"),
	  beep_long = document.getElementById("audio_beep-long"),
	  beep_short = document.getElementById("audio_beep-short"),
    audio_5 = document.getElementById("audio_5"),
    audio_4 = document.getElementById("audio_4"),
    audio_3 = document.getElementById("audio_3"),
    audio_2 = document.getElementById("audio_2"),
    audio_1 = document.getElementById("audio_1"),
	  alarm_mode_bool = false,
    preloaded = false,
	  backflow_bool = false,
    reflect_bool = false,
    lightning_bool = false,
    fire_bool = false,
    fuse_storm_bool = false,
    count_5 = false,
    count_4 = false,
    count_3 = false,
    count_2 = false,
    count_1 = false,
    volume_c,
    offset,
    clock,
    interval;

  // default options
  options = options || {};
  options.delay = options.delay || 1;

  // append elements
  element.appendChild(timer);

  // initialize
  reset();

  // private functions
  function createTimer() {
    return document.createElement("span");
  }

  function createButton(action, handler) {
    var a = document.createElement("a");
    a.href = "#" + action;
    a.innerHTML = action;
    a.addEventListener("click", function(event) {
      handler();
      event.preventDefault();
    });
    return a;
  }

  function setVolume(value) {
    volume_c = value / 100;
    //console.log('volume_c: ' + volume_c);
  }

  function start() {
    if (!interval) {
      offset = Date.now();
      interval = setInterval(update, options.delay);
    }
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function reset() {
    clock = time_limit;
    render(0);
  }

  function update() {
    clock -= delta();
    clock_value = clock / 1000;
    render();

    if (alarm_mode_bool) {
	     play_beep_mode(voice, clock_value);
     } else {
       play_voice_mode(voice, clock_value);
	   }

     if (clock <= 0) {
       clock = time_limit;
     }
  }

  function render() {
    value = clock / 1000;
    timer.innerHTML = value.toFixed(2);
  }

  function delta() {
    var now = Date.now(),
      d = now - offset;

    offset = now;
    return d;
  }

  function play_voice_mode(num, clock_value) {
    rounded_clock = clock_value.toFixed();

    if (num == 1) { //backflow
      play_backflow_voice(rounded_clock)
    } else if (num == 2) { //fire
      play_fire_voice(rounded_clock)
    } else if (num == 3) { //reflect
      play_reflect_voice(rounded_clock)
    } else if (num == 4) { //lightning
      play_lightning_voice(rounded_clock)
    } else if (num == 5) { //audio_fuse_storm
      play_fuse_storm_voice(rounded_clock)
    }
  }

  function play_backflow_voice(clock_value) {
    if (clock_value == 17) {
      backflow_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      backflow = false;

      if (!preloaded) {
        audio_backflow_in.load();
        preloaded = true;
      }
    }
    if (clock_value == 16) {
      if (!backflow_bool) {
        audio_backflow_in.volume = parseFloat(volume_c).toFixed(2);
        audio_backflow_in.play();
        preloaded = false;
        backflow_bool = true;
      }
    } else if (clock_value == 15) {
        if (!count_5) {
          countdown_voice(5)
          count_5 = true;
        }
    } else if (clock_value == 14) {
      if (!count_4) {
        countdown_voice(4)
        count_4 = true;
      }
    } else if (clock_value == 13) {
        if (!count_3) {
          countdown_voice(3)
          count_3 = true;
        }
    } else if (clock_value == 12) {
        if (!count_2) {
          countdown_voice(2)
          count_2 = true;
        }
    } else if (clock_value == 11) {
        if (!count_1) {
          countdown_voice(1)
          audio_backflow.load()
          count_1 = true;
        }
    } else if (clock_value == 10) {
        if (!backflow) {
          audio_backflow.volume = parseFloat(volume_c).toFixed(2);
          audio_backflow.play()
          backflow = true;
        }
    }
  }

  function play_fire_voice(clock_value) {
    if (clock_value == 7) {
      fire_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      fire = false;

      if (!preloaded) {
        audio_fire_in.load();
        preloaded = true;
      }
    }
    if (clock_value == 6) {
      if (!fire_bool) {
        audio_fire_in.volume = parseFloat(volume_c).toFixed(2);
        audio_fire_in.play();
        preloaded = false;
        fire_bool = true;
      }
    } else if (clock_value == 5) {
        if (!count_5) {
          countdown_voice(5)
          count_5 = true;
        }
    } else if (clock_value == 4) {
      if (!count_4) {
        countdown_voice(4)
        count_4 = true;
      }
    } else if (clock_value == 3) {
        if (!count_3) {
          countdown_voice(3)
          count_3 = true;
        }
    } else if (clock_value == 2) {
        if (!count_2) {
          countdown_voice(2)
          count_2 = true;
        }
    } else if (clock_value == 1) {
        if (!count_1) {
          countdown_voice(1)
          audio_fire.load()
          count_1 = true;
        }
    } else if (clock_value == 0) {
        if (!fire) {
          audio_fire.volume = parseFloat(volume_c).toFixed(2);
          audio_fire.play()
          fire = true;
        }
    }
  }

  function play_reflect_voice(clock_value) {
    if (clock_value == 12) {
      reflect_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      reflect = false;

      if (!preloaded) {
        audio_reflect_in.load();
        preloaded = true;
      }
    }
    if (clock_value == 11) {
      if (!reflect_bool) {
        audio_reflect_in.volume = parseFloat(volume_c).toFixed(2);
        audio_reflect_in.play();
        preloaded = false;
        reflect_bool = true;
      }
    } else if (clock_value == 10) {
        if (!count_5) {
          countdown_voice(5)
          count_5 = true;
        }
    } else if (clock_value == 9) {
      if (!count_4) {
        countdown_voice(4)
        count_4 = true;
      }
    } else if (clock_value == 8) {
        if (!count_3) {
          countdown_voice(3)
          count_3 = true;
        }
    } else if (clock_value == 7) {
        if (!count_2) {
          countdown_voice(2)
          count_2 = true;
        }
    } else if (clock_value == 6) {
        if (!count_1) {
          countdown_voice(1)
          audio_reflect.load()
          count_1 = true;
        }
    } else if (clock_value == 5) {
        if (!reflect) {
          audio_reflect.volume = parseFloat(volume_c).toFixed(2);
          audio_reflect.play()
          reflect = true;
        }
    }
  }

  function play_lightning_voice(clock_value) {
    if (clock_value == 7) {
      lightning_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      lightning = false;

      if (!preloaded) {
        audio_lightning_in.load();
        preloaded = true;
      }
    }
    if (clock_value == 6) {
      if (!lightning_bool) {
        audio_lightning_in.volume = parseFloat(volume_c).toFixed(2);
        audio_lightning_in.play();
        preloaded = false;
        lightning_bool = true;
      }
    } else if (clock_value == 5) {
        if (!count_5) {
          countdown_voice(5)
          count_5 = true;
        }
    } else if (clock_value == 4) {
      if (!count_4) {
        countdown_voice(4)
        count_4 = true;
      }
    } else if (clock_value == 3) {
        if (!count_3) {
          countdown_voice(3)
          count_3 = true;
        }
    } else if (clock_value == 2) {
        if (!count_2) {
          countdown_voice(2)
          count_2 = true;
        }
    } else if (clock_value == 1) {
        if (!count_1) {
          countdown_voice(1)
          audio_lightning.load()
          count_1 = true;
        }
    } else if (clock_value == 0) {
        if (!lightning) {
          audio_lightning.volume = parseFloat(volume_c).toFixed(2);
          audio_lightning.play()
          lightning = true;
        }
    }
  }

  function play_fuse_storm_voice(clock_value) {
    if (clock_value == 7) {
      fuse_storm_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      fuse_storm = false;

      if (!preloaded) {
        audio_fuse_storm_in.load();
        preloaded = true;
      }
    }
    if (clock_value == 6) {
      if (!fuse_storm_bool) {
        audio_fuse_storm_in.volume = parseFloat(volume_c).toFixed(2);
        audio_fuse_storm_in.play();
        preloaded = false;
        fuse_storm_bool = true;
      }
    } else if (clock_value == 5) {
        if (!count_5) {
          countdown_voice(5)
          count_5 = true;
        }
    } else if (clock_value == 4) {
      if (!count_4) {
        countdown_voice(4)
        count_4 = true;
      }
    } else if (clock_value == 3) {
        if (!count_3) {
          countdown_voice(3)
          count_3 = true;
        }
    } else if (clock_value == 2) {
        if (!count_2) {
          countdown_voice(2)
          count_2 = true;
        }
    } else if (clock_value == 1) {
        if (!count_1) {
          countdown_voice(1)
          audio_fuse_storm.load()
          count_1 = true;
        }
    } else if (clock_value == 0) {
        if (!fuse_storm) {
          audio_fuse_storm.volume = parseFloat(volume_c).toFixed(2);
          audio_fuse_storm.play()
          fire = true;
        }
    }
  }

  function play_beep_mode(num, clock_value) {
    rounded_clock = clock_value.toFixed();

    if (num == 1) { //backflow
      play_backflow_beep(rounded_clock)
    } else if (num == 2) { //fire
      play_fire_beep(rounded_clock)
    } else if (num == 3) { //reflect
      play_reflect_beep(rounded_clock)
    } else if (num == 4) { //lightning
      play_lightning_beep(rounded_clock)
    } else if (num == 5) { //lightning
      play_fuse_storm_beep(rounded_clock)
    }
  }

  function play_backflow_beep(clock_value) {
    if (clock_value == 16) {
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      backflow = false;

      if (!preloaded) {
        beep_short.load();
        beep_long.load();
        preloaded = true;
      }
    }
    if (clock_value == 15) {
        if (!count_5) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_5 = true;
        }
    } else if (clock_value == 14) {
      if (!count_4) {
        beep_short.volume = parseFloat(volume_c).toFixed(2);
        beep_short.play();
        count_4 = true;
      }
    } else if (clock_value == 13) {
        if (!count_3) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_3 = true;
        }
    } else if (clock_value == 12) {
        if (!count_2) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_2 = true;
        }
    } else if (clock_value == 11) {
        if (!count_1) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_1 = true;
        }
    } else if (clock_value == 10) {
        if (!backflow) {
          beep_long.volume = parseFloat(volume_c).toFixed(2);
          beep_long.play();
          backflow = true;
        }
    }
  }

  function play_fire_beep(clock_value) {
    if (clock_value == 7) {
      fire_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      fire = false;

      if (!preloaded) {
        beep_short.load();
        beep_long.load();
        preloaded = true;
      }
    }
    if (clock_value == 5) {
        if (!count_5) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_5 = true;
        }
    } else if (clock_value == 4) {
        if (!count_4) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_4 = true;
      }
    } else if (clock_value == 3) {
        if (!count_3) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_3 = true;
        }
    } else if (clock_value == 2) {
        if (!count_2) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_2 = true;
        }
    } else if (clock_value == 1) {
        if (!count_1) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_1 = true;
        }
    } else if (clock_value == 0) {
        if (!fire) {
          beep_long.volume = parseFloat(volume_c).toFixed(2);
          beep_long.play();
          fire = true;
        }
    }
  }

  function play_reflect_beep(clock_value) {
    if (clock_value == 11) {
      reflect_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      reflect = false;

      if (!preloaded) {
        beep_short.load();
        beep_long.load();
        preloaded = true;
      }
    }
    if (clock_value == 10) {
        if (!count_5) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_5 = true;
        }
    } else if (clock_value == 9) {
      if (!count_4) {
        beep_short.volume = parseFloat(volume_c).toFixed(2);
        beep_short.play();
        count_4 = true;
      }
    } else if (clock_value == 8) {
        if (!count_3) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_3 = true;
        }
    } else if (clock_value == 7) {
        if (!count_2) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_2 = true;
        }
    } else if (clock_value == 6) {
        if (!count_1) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_1 = true;
        }
    } else if (clock_value == 5) {
        if (!reflect) {
          beep_long.volume = parseFloat(volume_c).toFixed(2);
          beep_long.play();
          reflect = true;
        }
    }
  }

  function play_lightning_beep(clock_value) {
    if (clock_value == 7) {
      lightning_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      lightning = false;

      if (!preloaded) {
        beep_short.load();
        beep_long.load();
        preloaded = true;
      }
    }
    if (clock_value == 5) {
        if (!count_5) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_5 = true;
        }
    } else if (clock_value == 4) {
      if (!count_4) {
        beep_short.volume = parseFloat(volume_c).toFixed(2);
        beep_short.play();
        count_4 = true;
      }
    } else if (clock_value == 3) {
        if (!count_3) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_3 = true;
        }
    } else if (clock_value == 2) {
        if (!count_2) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_2 = true;
        }
    } else if (clock_value == 1) {
        if (!count_1) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_1 = true;
        }
    } else if (clock_value == 0) {
        if (!lightning) {
          beep_long.volume = parseFloat(volume_c).toFixed(2);
          beep_long.play();
          lightning = true;
        }
    }
  }

  function play_fuse_storm_beep(clock_value) {
    if (clock_value == 7) {
      fuse_storm_bool = false;
      count_5 = false;
      count_4 = false;
      count_3 = false;
      count_2 = false;
      count_1 = false;
      fuse_storm = false;

      if (!preloaded) {
        beep_short.load();
        beep_long.load();
        preloaded = true;
      }
    }
    if (clock_value == 5) {
        if (!count_5) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_5 = true;
        }
    } else if (clock_value == 4) {
        if (!count_4) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_4 = true;
      }
    } else if (clock_value == 3) {
        if (!count_3) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_3 = true;
        }
    } else if (clock_value == 2) {
        if (!count_2) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_2 = true;
        }
    } else if (clock_value == 1) {
        if (!count_1) {
          beep_short.volume = parseFloat(volume_c).toFixed(2);
          beep_short.play();
          count_1 = true;
        }
    } else if (clock_value == 0) {
        if (!fuse_storm) {
          beep_long.volume = parseFloat(volume_c).toFixed(2);
          beep_long.play();
          fuse_storm = true;
        }
    }
  }

  function countdown_voice(num) {
    if (num == 1) {
      audio_1.volume = parseFloat(volume_c).toFixed(2);
      audio_1.play();
    } else if (num == 2) {
        audio_2.volume = parseFloat(volume_c).toFixed(2);
        audio_2.play()
	      //audio_1.load()
    } else if (num == 3) {
        audio_3.volume = parseFloat(volume_c).toFixed(2);
        audio_3.play()
	      //audio_2.load()
    } else if (num == 4) {
        audio_4.volume = parseFloat(volume_c).toFixed(2);
        audio_4.play()
	      //audio_3.load()
    } else if (num == 5) {
        audio_5.volume = parseFloat(volume_c).toFixed(2);
        audio_5.play()
	      //audio_4.load()
    }
  }

  function alarm_mode() {
    if (alarm_mode_bool) {
      voice_option.value="Voice On";
      alarm_mode_bool = false;
    } else {
      voice_option.value="Beep On";
      alarm_mode_bool = true;
    }
  }

  // public API
  this.start = start;
  this.stop = stop;
  this.reset = reset;
  this.alarm_mode = alarm_mode;
  this.setVolume = setVolume;
};


//draggable & resizeable
function initDragElement() {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  var popups = document.getElementsByClassName("popup");
  var elmnt = null;
  var currentZIndex = 100; //TODO reset z index when a threshold is passed

  for (var i = 0; i < popups.length; i++) {
    var popup = popups[i];
    var header = getHeader(popup);

    popup.onmousedown = function() {
      this.style.zIndex = "" + ++currentZIndex;
    };

    if (header) {
      header.parentPopup = popup;
      header.onmousedown = dragMouseDown;
    }
  }

  function dragMouseDown(e) {
    elmnt = this.parentPopup;
    elmnt.style.zIndex = "" + ++currentZIndex;

    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    if (!elmnt) {
      return;
    }

    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }

  function getHeader(element) {
    var headerItems = element.getElementsByClassName("popup-header");

    if (headerItems.length === 1) {
      return headerItems[0];
    }

    return null;
  }
}

function initResizeElement() {
  var popups = document.getElementsByClassName("popup");
  var element = null;
  var startX, startY, startWidth, startHeight;

  for (var i = 0; i < popups.length; i++) {
    var p = popups[i];

    var right = document.createElement("div");
    right.className = "resizer-right";
    p.appendChild(right);
    right.addEventListener("mousedown", initDrag, false);
    right.parentPopup = p;

    var bottom = document.createElement("div");
    bottom.className = "resizer-bottom";
    p.appendChild(bottom);
    bottom.addEventListener("mousedown", initDrag, false);
    bottom.parentPopup = p;

    var both = document.createElement("div");
    both.className = "resizer-both";
    p.appendChild(both);
    both.addEventListener("mousedown", initDrag, false);
    both.parentPopup = p;
  }

  function initDrag(e) {
    element = this.parentPopup;

    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(
      document.defaultView.getComputedStyle(element).width,
      10
    );
    startHeight = parseInt(
      document.defaultView.getComputedStyle(element).height,
      10
    );
    document.documentElement.addEventListener("mousemove", doDrag, false);
    document.documentElement.addEventListener("mouseup", stopDrag, false);
  }

  function doDrag(e) {
    element.style.width = startWidth + e.clientX - startX + "px";
    element.style.height = startHeight + e.clientY - startY + "px";
  }

  function stopDrag() {
    document.documentElement.removeEventListener("mousemove", doDrag, false);
    document.documentElement.removeEventListener("mouseup", stopDrag, false);
  }
}

//Background Change
const bg_change_interval = setInterval(setColor, 500);

function setColor() {
  let backflow_div = document.getElementById("backflow_div");
  let backflow_value = document.getElementById("backflow").innerText;

  if (backflow_value >= 15) {
   backflow_div.style.backgroundColor = "#B9FEC2";
  } else if (backflow_value >= 10 && backflow_value <= 15){
    backflow_div.style.backgroundColor = "#FDE6A5";
  } else if (backflow_value <= 10) {
    backflow_div.style.backgroundColor = "#FDABA5";
  }

  let reflect_div = document.getElementById("reflect_div");
  let reflect_value = document.getElementById("reflect").innerText;

  if (reflect_value >= 10) {
   reflect_div.style.backgroundColor = "#B9FEC2";
  } else if (reflect_value >= 5 && reflect_value <= 10){
    reflect_div.style.backgroundColor = "#FDE6A5";
  } else if (reflect_value <= 5) {
    reflect_div.style.backgroundColor = "#FDABA5";
  }

  let fire_div = document.getElementById("fire_div");
  let fire_value = document.getElementById("fire").innerText;

  if (fire_value >= 10) {
   fire_div.style.backgroundColor = "#B9FEC2";
  } else if (fire_value >= 5 && fire_value <= 10){
    fire_div.style.backgroundColor = "#FDE6A5";
  } else if (fire_value <= 5) {
    fire_div.style.backgroundColor = "#FDABA5";
  }

  let lightning_div = document.getElementById("lightning_div");
  let lightning_value = document.getElementById("lightning").innerText;

  if (lightning_value >= 10) {
   lightning_div.style.backgroundColor = "#B9FEC2";
  } else if (lightning_value >= 5 && lightning_value <= 10){
    lightning_div.style.backgroundColor = "#FDE6A5";
  } else if (lightning_value <= 5) {
    lightning_div.style.backgroundColor = "#FDABA5";
  }

  let fuse_storm_div = document.getElementById("fuse_storm_div");
  let fuse_storm_value = document.getElementById("fuse_storm").innerText;

  if (fuse_storm_value >= 10) {
   fuse_storm_div.style.backgroundColor = "#B9FEC2";
  } else if (fuse_storm_value >= 5 && fuse_storm_value <= 10){
    fuse_storm_div.style.backgroundColor = "#FDE6A5";
  } else if (fuse_storm_value <= 5) {
    fuse_storm_div.style.backgroundColor = "#FDABA5";
  }
}

function nightmode() {
  document.body.classList.toggle('night-filter');
}

//Onload function
window.onload = function() {
  var backflow_option = document.getElementById("backflow_option");
  var anew = document.getElementById("backflow");
  backflow_timer = new Stopwatch(anew, backflow_option, {delay: 1}, 30000, 1);

  var reflect_option = document.getElementById("reflect_option");
  var bnew = document.getElementById("reflect");
  reflect_timer = new Stopwatch(bnew, reflect_option, {delay: 1}, 35000, 3);

  var fire_option = document.getElementById("fire_option");
  var cnew = document.getElementById("fire");
  fire_timer = new Stopwatch(cnew, fire_option, {delay: 1}, 30000, 2);

  var lightning_option = document.getElementById("lightning_option");
  var dnew = document.getElementById("lightning");
  lightning_timer = new Stopwatch(dnew, lightning_option, {delay: 1}, 30000, 4);

  var fuse_storm_option = document.getElementById("fuse_storm_option");
  var enew = document.getElementById("fuse_storm");
  fuse_storm_timer = new Stopwatch(enew, fuse_storm_option, {delay: 1}, 25000, 5);
  initDragElement();
  initResizeElement();
};
</script>

<div class="container text-center">
  <h2>Timers</h2>
  <p>Each timers can be moved or resized to your desired. You can also change between voice or beep for alert.</p>
  <p>How to use : Start timer right after the effect has ended.</p>
  <p>
    <button class="btn btn-outline-dark btn-lg" onclick="nightmode()" id="night-filter">Nightmode Filter</button>
  </p>
  <br/>

  <div class="row justify-content-evenly">
    <div class="col-4">
			<div class="popup" id="backflow_div">
				<div class="popup-header">Click here to move</div>
				<br/>
				<h2 id="backflow_title" class="font">Backflow</h2>
				<h1 class="stopwatch font" id="backflow"></h1>
				<button onclick="backflow_timer.start()" class="btn btn-success">Start</button>
				<button onclick="backflow_timer.stop()" class="btn btn-danger">Stop</button>
				<button onclick="backflow_timer.reset()" class="btn btn-secondary">Reset</button>
				<p></p>
        <p>Voice/Beep Option</p>
        <input onclick="backflow_timer.alarm_mode()" type="button" class="btn btn-secondary" id="backflow_option" value="Voice On" />
        <p></p>
        <p>Volume Control</p>
        <input id="backflow_vol-control" type="range" min="0" max="100" step="1" oninput="backflow_timer.setVolume(this.value)" onchange="backflow_timer.setVolume(this.value)"></input>
				<br/>
				<br/>
      </div>
    </div>
    <div class="col-4">
			<div class="popup" id="reflect_div">
				<div class="popup-header">Click here to move</div>
				<br/>
				<h2 id="reflect_title" class="font">Reflect</h2>
				<h1 class="stopwatch font" id="reflect"></h1>
				<button onclick="reflect_timer.start()" class="btn btn-success">Start</button>
				<button onclick="reflect_timer.stop()" class="btn btn-danger">Stop</button>
				<button onclick="reflect_timer.reset()" class="btn btn-secondary">Reset</button>
				<p></p>
        <p>Voice/Beep Option</p>
        <input onclick="reflect_timer.alarm_mode()" type="button" class="btn btn-secondary" id="reflect_option" value="Voice On" />
        <p></p>
        <p>Volume Control</p>
        <input id="reflect_vol-control" type="range" min="0" max="100" step="1" oninput="reflect_timer.setVolume(this.value)" onchange="reflect_timer.setVolume(this.value)"></input>
				<br/>
        <br/>
			</div>
    </div>
  </div>

	<div class="d-grid gap-3">
		<div class="p-2"></div>
		<div class="p-2"></div>
		<div class="p-2"></div>
	</div>
	<div class="d-grid gap-3">
		<div class="p-2"></div>
		<div class="p-2"></div>
		<div class="p-2"></div>
	</div>
	<div class="d-grid gap-3">
		<div class="p-2"></div>
		<div class="p-2"></div>
		<div class="p-2"></div>
	</div>

  <div class="row justify-content-evenly">
    <div class="col-4">
			<div class="popup" id="fire_div">
				<div class="popup-header">Click here to move</div>
				<br/>
				<h2 id="fire_title" class="font">Fire</h2>
				<h1 class="stopwatch font" id="fire"></h1>
				<button onclick="fire_timer.start()" class="btn btn-success">Start</button>
				<button onclick="fire_timer.stop()" class="btn btn-danger">Stop</button>
				<button onclick="fire_timer.reset()" class="btn btn-secondary">Reset</button>
				<p></p>
        <p>Voice/Beep Option</p>
        <input onclick="fire_timer.alarm_mode()" type="button" class="btn btn-secondary" id="fire_option" value="Voice On" />
        <p></p>
        <p>Volume Control</p>
        <input id="fire_vol-control" type="range" min="0" max="100" step="1" oninput="fire_timer.setVolume(this.value)" onchange="fire_timer.setVolume(this.value)"></input>
				<br/>
				<br/>
			</div>
    </div>
  <div class="col-4">
		<div class="popup" id="lightning_div">
			<div class="popup-header">Click here to move</div>
			<br/>
			<h2 id="lightning_title" class="font">Lightning</h2>
			<h1 class="stopwatch font" id="lightning"></h1>
			<button onclick="lightning_timer.start()" class="btn btn-success">Start</button>
			<button onclick="lightning_timer.stop()" class="btn btn-danger">Stop</button>
			<button onclick="lightning_timer.reset()" class="btn btn-secondary">Reset</button>
			<p></p>
      <p>Voice/Beep Option</p>
      <input onclick="lightning_timer.alarm_mode()" type="button" class="btn btn-secondary" id="lightning_option" value="Voice On" />
      <p></p>
      <p>Volume Control</p>
      <input id="lightning_vol-control" type="range" min="0" max="100" step="1" oninput="lightning_timer.setVolume(this.value)" onchange="lightning_timer.setVolume(this.value)"></input>
			<br/>
			<br/>
		</div>
  </div>
  </div>

  <div class="d-grid gap-3">
    <div class="p-2"></div>
    <div class="p-2"></div>
    <div class="p-2"></div>
  </div>
  <div class="d-grid gap-3">
    <div class="p-2"></div>
    <div class="p-2"></div>
    <div class="p-2"></div>
  </div>
  <div class="d-grid gap-3">
    <div class="p-2"></div>
    <div class="p-2"></div>
    <div class="p-2"></div>
  </div>

  <div class="row justify-content-evenly">
    <div class="col-4">
      <div class="popup" id="fuse_storm_div">
        <div class="popup-header">Click here to move</div>
        <br/>
        <h2 id="fuse_storm_title" class="font">Fuse Storm</h2>
        <h1 class="stopwatch font" id="fuse_storm"></h1>
        <button onclick="fuse_storm_timer.start()" class="btn btn-success">Start</button>
        <button onclick="fuse_storm_timer.stop()" class="btn btn-danger">Stop</button>
        <button onclick="fuse_storm_timer.reset()" class="btn btn-secondary">Reset</button>
        <p></p>
        <p>Voice/Beep Option</p>
        <input onclick="fuse_storm_timer.alarm_mode()" type="button" class="btn btn-secondary" id="fuse_storm_option" value="Voice On" />
        <p></p>
        <p>Volume Control</p>
        <input id="fuse_storm_vol-control" type="range" min="0" max="100" step="1" oninput="fuse_storm_timer.setVolume(this.value)" onchange="fuse_storm_timer.setVolume(this.value)"></input>
        <br/>
        <br/>
      </div>
    </div>
  </div>

  <audio hidden preload="auto" id="audio_backflow_in">
	   <source src="{% static 'audio/backflow-in.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_backflow">
	   <source src="{% static 'audio/backflow.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_fire_in">
	   <source src="{% static 'audio/fire-in.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_fire">
	   <source src="{% static 'audio/fire.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_reflect_in">
	   <source src="{% static 'audio/reflect-in.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_reflect">
	   <source src="{% static 'audio/reflect.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_lightning_in">
	   <source src="{% static 'audio/lightning-in.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_lightning">
	   <source src="{% static 'audio/lightning.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_fuse_storm">
	   <source src="{% static 'audio/fuse-storm.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_fuse_storm_in">
	   <source src="{% static 'audio/fuse-storm-in.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_5">
	   <source src="{% static 'audio/5.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_4">
	   <source src="{% static 'audio/4.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_3">
	   <source src="{% static 'audio/3.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_2">
	   <source src="{% static 'audio/2.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_1">
	   <source src="{% static 'audio/1.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_beep-long">
	   <source src="{% static 'audio/beep-long.mp3' %}" type="audio/mpeg">
  </audio>
  <audio hidden preload="auto" id="audio_beep-short">
	   <source src="{% static 'audio/beep-short.mp3' %}" type="audio/mpeg">
  </audio>
</div>
{% endblock %}
```

## File: .gitignore
```
db.sqlite3
*.pyc
```

## File: manage.py
```python
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
```

## File: README.md
```markdown
# django_bu_app
Bless Unleash PC Helper
https://butools.xyz/
```
